#!/bin/bash
cd /home/gu-da/cbc/frontend/src/pages

# List of common Lucide icons to wrap
ICONS="Activity AlertCircle AlertTriangle Anchor ArrowLeft ArrowRight Award Ban Building Building2 Calendar CheckCircle Clock Coffee Database Description DollarSign Download Edit Eye FileCheck FileSearch FileText GitBranch Globe History Link2 Lock LogIn MapPin Network Package Plus Science Settings Shield ShieldCheck Ship Star TrendingDown TrendingUp User Users VerifiedUser X Zap"

for icon in $ICONS; do
  # Wrap direct renders: <Icon size={...} ... />
  find . -name "*.tsx" -exec sed -i -E "s/<${icon} (size=\{[0-9]+\}[^>]*)\/>/<span><${icon} \1\/><\/span>/g" {} \;
  
  # Wrap with color prop: <Icon size={...} color="..." />
  find . -name "*.tsx" -exec sed -i -E "s/<${icon} (size=\{[0-9]+\} color=\"[^\"]+\")\/>/<span><${icon} \1\/><\/span>/g" {} \;
done

echo "✅ All direct icon renders fixed!"
