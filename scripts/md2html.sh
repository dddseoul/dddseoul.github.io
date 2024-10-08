#!/bin/bash
# Converts all markdown template files to HTML template files.

set -e

REPOSITORY_ROOT=$(git rev-parse --show-toplevel)

# Clone MD2HTML repository
echo -e "\033[36mCloning apps...\033[0m"

cd "$REPOSITORY_ROOT"
git clone --depth=1 --single-branch https://github.com/justinyoo/markdown-to-html-for-techcommunity.git md2html
cd md2html
cp src/MD2Html.FunctionApp/local.settings.sample.json src/MD2Html.FunctionApp/local.settings.json
dotnet restore && dotnet build
cd src/MD2Html.FunctionApp

# Run the function app in the background
echo -e "\033[36mRunning converter apps in the background...\033[0m"

func=$(command -v func)
"$func" start --verbose false &

sleep 30

# Get all the markdown template files
echo -e "\033[36mConverting markdown template files to HTML template files...\033[0m"

cd "$REPOSITORY_ROOT/templates"
mds=$(find . -name "*.md")

# Convert markdown to HTML
for md in $mds; do
    html="${md%.md}.html"
    content=$(cat "$md")
    url="http://localhost:7071/api/convert/md/to/html"
    curl -X POST -H "Content-Type: text/plain" -d "$content" "$url" -o "$html"

    echo -e "\033[36m... $md converted to $html\033[0m"
done

# Clean up
FUNC_PID=$(lsof -t -i:7071)
if [[ -n "$FUNC_PID" ]]; then
    kill -9 "$FUNC_PID"
fi

rm -rf "$REPOSITORY_ROOT/md2html"
cd "$REPOSITORY_ROOT"