
param (
    [string]$Directory = "c:\project\cbc\frontend"
)

function Resolve-File {
    param ([string]$FilePath)

    try {
        $content = Get-Content -Path $FilePath -Raw
        if ($content -match "<<<<<<< HEAD") {
            Write-Host "Fixing conflicts in: $FilePath"
            
            # Pattern to match conflict blocks and keep HEAD
            # Matches <<<<<<< HEAD ... ======= ... >>>>>>> ...
            # We want to keep the content between HEAD and =======
            
            # Using Regex.Replace with a scriptblock/evaluator for complex multiline logic is tricky in plain -replace operator
            # So we will process line by line or use DotNet regex
            
            $lines = Get-Content -Path $FilePath
            $newLines = @()
            $state = "NORMAL" # NORMAL, IN_HEAD, IN_TAIL
            
            foreach ($line in $lines) {
                if ($line -match "^<<<<<<< HEAD") {
                    $state = "IN_HEAD"
                    continue
                }
                elseif ($line -match "^=======") {
                    if ($state -eq "IN_HEAD") {
                        $state = "IN_TAIL"
                    }
                    else {
                        $newLines += $line
                    }
                    continue
                }
                elseif ($line -match "^>>>>>>>") {
                    if ($state -eq "IN_TAIL") {
                        $state = "NORMAL"
                    }
                    else {
                        $newLines += $line
                    }
                    continue
                }
                
                if ($state -eq "NORMAL") {
                    $newLines += $line
                }
                elseif ($state -eq "IN_HEAD") {
                    $newLines += $line
                }
                # If IN_TAIL, we skip (delete) the line
            }
            
            $newLines | Set-Content -Path $FilePath -Encoding UTF8
        }
    }
    catch {
        Write-Warning "Failed to process $FilePath : $_"
    }
}

Write-Host "Scanning directory: $Directory"
$files = Get-ChildItem -Path $Directory -Recurse -File -Include *.ts, *.tsx, *.js, *.jsx, *.css, *.html, *.json

foreach ($file in $files) {
    if ($file.FullName -notmatch "node_modules") {
        Resolve-File -FilePath $file.FullName
    }
}

Write-Host "Conflict resolution failed." 
