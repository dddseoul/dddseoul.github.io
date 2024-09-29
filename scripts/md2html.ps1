# Converts all markdown template files to HTML template files.
$REPOSITORY_ROOT = git rev-parse --show-toplevel

# Clone MD2HTML repository
Write-Host "Cloning apps..." -ForegroundColor Cyan

cd $REPOSITORY_ROOT
git clone https://github.com/justinyoo/markdown-to-html-for-techcommunity.git md2html
cd md2html
Copy-Item -Path src/MD2Html.FunctionApp/local.settings.sample.json -Destination src/MD2Html.FunctionApp/local.settings.json -Force
dotnet restore && dotnet build
cd src/MD2Html.FunctionApp

# Run the function app in the background
Write-Host "Running converter apps in the background..." -ForegroundColor Cyan

if ($IsWindows -eq $true) {
    $func = $(Get-Command func).Source.Replace(".ps1", ".cmd")
    Start-Process -NoNewWindow "$func" @("start","--verbose","false")
} else {
    Start-Process -NoNewWindow func @("start","--verbose","false")
}
Start-Sleep -s 30

# Get all the markdown template files
Write-Host "Converting markdown template files to HTML template files..." -ForegroundColor Cyan

cd "$($REPOSITORY_ROOT)/templates"
$mds = (Get-Item -Path *.md).FullName

# Convert markdown to HTML
$mds | ForEach-Object {
    $md = $_
    $html = $md.Replace(".md", ".html")
    $content = Get-Content -Path $md -Raw
    $url = "http://localhost:7071/api/convert/md/to/html"
    Invoke-RestMethod -Uri $url -Method Post -Body $content -ContentType "text/plain" -OutFile $html

    Write-Host "... $md converted to $html" -ForegroundColor Cyan
}

# Clean up
if ($IsWindows -eq $true) {
    $FUNC_PID = Get-NetTCPConnection -LocalPort 7071 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Get-Unique
    if ($FUNC_PID) {
        $FUNC_PID | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    }
} else {
    $FUNC_PID = $(lsof -t -i:7071)
    if ($FUNC_PID) {
        kill -9 $FUNC_PID
    }
}

Remove-Item -Path "$($REPOSITORY_ROOT)/md2html" -Recurse -Force
cd $REPOSITORY_ROOT