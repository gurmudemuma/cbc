#!/bin/bash
# Update all network scripts to replace ECTA with ECTA

echo "🔧 Updating all network scripts: ECTA → ECTA"
echo ""

cd /home/gu-da/cbc/network/scripts

# Update all shell scripts
for file in *.sh; do
    if [ -f "$file" ]; then
        if grep -q "ncat\|ECTA" "$file"; then
            echo "Updating $file..."
            # Replace ECTA with ECTA
            sed -i 's/ECTAMSP/ECTAMSP/g' "$file"
            sed -i 's/ECTA/ECTA/g' "$file"
            sed -i 's/ncat\.coffee-export\.com/ecta.coffee-export.com/g' "$file"
            sed -i 's/peer0\.ncat/peer0.ecta/g' "$file"
            sed -i 's/@ncat\.coffee-export\.com/@ecta.coffee-export.com/g' "$file"
            sed -i 's/connection-ncat/connection-ecta/g' "$file"
            sed -i 's/tlsca\.ncat/tlsca.ecta/g' "$file"
            sed -i 's/ca\.ncat/ca.ecta/g' "$file"
            sed -i 's/ORG=ncat/ORG=ecta/g' "$file"
            sed -i 's/ORGMSP=ECTA/ORGMSP=ECTA/g' "$file"
            # Fix comments
            sed -i 's/Install on ECTA/Install on ECTA/g' "$file"
            sed -i 's/Joining ECTA/Joining ECTA/g' "$file"
            sed -i 's/Approving for ECTA/Approving for ECTA/g' "$file"
            echo "  ✓ $file updated"
        fi
    fi
done

echo ""
echo "✅ All network scripts updated!"
echo ""
echo "Files updated:"
ls -1 *.sh | while read file; do
    if grep -q "ecta\|ECTA" "$file" 2>/dev/null; then
        echo "  ✓ $file"
    fi
done
