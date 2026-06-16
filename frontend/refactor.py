import re

with open("src/app/pages/dashboard.component.ts", "r") as f:
    content = f.read()

# Match the template and styles blocks and replace them.
new_content = re.sub(
    r'template:\s*`[\s\S]*?`,\n\s*styles:\s*\[`[\s\S]*?`\]\n}\)',
    "templateUrl: './dashboard.component.html',\n  styleUrls: ['./dashboard.component.scss']\n})",
    content
)

with open("src/app/pages/dashboard.component.ts", "w") as f:
    f.write(new_content)
    
print("Replaced successfully")
