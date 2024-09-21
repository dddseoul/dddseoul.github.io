# DDD Seoul 웹사이트

DDD Seoul 웹사이트는 [Statiq](https://www.statiq.dev/) 정적 웹사이트 생성도구를 이용해서 만들었으며, [https://dddseoul.kr](https://dddseoul.kr)에서 확인할 수 있습니다.

## 사전 요구사항

- [.NET SDK 8+](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Visual Studio 2022](https://visualstudio.microsoft.com/vs/) 또는 [Visual Studio Code](https://code.visualstudio.com/) + [C# DevKit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit)
- 윈도우 사용자: [PowerShell 7+](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)

## 시작하기

1. 저장소를 자신의 로컬 컴퓨터로 클론합니다.

    ```bash
    git clone https://github.com/dddseoul/dddseoul.github.io.git
    ```

1. 저장소 디렉토리로 이동합니다.

    ```bash
    cd dddseoul.github.io
    ```

1. 프로젝트를 빌드하고 실행합니다.

    ```bash
    dotnet restore && dotnet build && dotnet run --project ./src/DDDSeoul -- preview
    ```

1. 웹 브라우저에서 [http://localhost:5080](http://localhost:5080)로 접속합니다.

1. 배포를 위해 아티팩트를 생성하려면 아래 명령어를 실행합니다.

    ```bash
    dotnet run --project ./src/DDDSeoul -- preview
    ```

## 컨텐츠 수정하기

- 컨텐츠는 `src/DDDSeoul/input` 디렉토리에 위치합니다. `index.md` 파일을 수정하면 웹사이트의 첫 페이지를 수정할 수 있습니다.
- `src/DDDSeoul/input` 디렉토리에 새로운 Markdown 파일을 추가하면 새로운 페이지를 만들 수 있습니다.

## 웹사이트에 문제가 있나요?

문제가 있거나 개선할 점이 있다면 [이슈](../../issues)를 등록해주세요.
