Title: 송민석
Description: "송민석 - 에이전트가 결정하고, 컨테이너가 실행한다: Microsoft Foundry 루틴과 Azure Container Apps Jobs로 만드는 신뢰 할 수 있는 AI 워크플로우"
SpeakerAffiliation: "Microsoft MVP | Co-op Translator 메인테이너"
SpeakerPhoto: /images/speakers/minseoksong.jpg
---
## 발표자 소개

Microsoft MVP이자 오픈소스 AI 번역 도구 Co-op Translator의 메인테이너입니다. Azure AI를 활용해 Microsoft의 개발자 교육 콘텐츠를 여러 언어로 번역하는 자동화 도구를 개발하고 운영하고 있습니다.

다양한 언어의 기여자들과 협업하며 번역 품질과 자동화의 안정성을 개선하고 있습니다. 실제 프로젝트에서 마주한 문제와 해결 과정, 오픈소스 유지보수 경험을 개발자 커뮤니티와 나누는 데 관심이 있습니다.

## 세션 정보

### 에이전트가 결정하고, 컨테이너가 실행한다: Microsoft Foundry 루틴과 Azure Container Apps Jobs로 만드는 신뢰 할 수 있는 AI 워크플로우

AI 에이전트는 요청을 이해하고 계획을 세우는 데 뛰어납니다. 하지만 몇 분에서 몇 시간 동안 이어지는 작업과 그 과정에서 발생하는 시간 초과, 부분 실패, 중복 실행, 재시도까지 에이전트에게 직접 맡겨도 괜찮을까요?

이 세션에서는 다국어 문서 현지화 시스템 Localizeflow를 사례로, 에이전트의 판단과 실제 작업 실행을 분리하는 아키텍처를 소개합니다.

GitHub에 현지화 요청 이슈가 등록되면 Microsoft Foundry 루틴이 에이전트를 실행합니다. 에이전트는 저장소의 변경 사항을 분석해 번역이 필요한 문서와 대상 언어, 작업 우선순위를 결정합니다. 반면 저장소 복제, 번역, 용어 검증, 링크 검사, 빌드, Pull Request 생성과 같은 실제 작업은 언어별 Azure Container Apps Jobs가 격리된 컨테이너 환경에서 수행합니다.

라이브 데모에서는 Pull Request를 생성한 뒤 작업 완료 상태를 기록하기 직전에 의도적으로 실패를 발생시킵니다. 이후 ACA Job이 재시도되면서 기존 실행 결과를 식별하고, 중복 Pull Request를 만들지 않은 채 작업을 복구하는 과정을 보여드립니다. 이 흐름을 통해 재시도, 상태 관리, 작업 격리를 실제 아키텍처 안에서 살펴봅니다.

또한 Azure Functions, 상시 실행되는 Container App, Kubernetes Jobs와 비교해 왜 ACA Jobs를 선택했는지 설명합니다. 그리고 이러한 구조가 필요한 작업과, 단순한 예약 실행이나 이벤트 기반 처리만으로 충분한 작업을 어떻게 구분할 수 있는지도 함께 다룹니다.

에이전트에게는 무엇을 해야 할지 결정하게 하되, 그 작업의 신뢰성까지 맡기지는 않는다는 것이 이 세션의 핵심 주제입니다.

이 세션에서는 AI 에이전트의 판단 능력과 컨테이너 기반 실행 환경의 신뢰성을 결합해, 실제 운영 환경에서 실패하고 재시도해도 안전한 AI 워크플로를 설계하는 방법을 함께 살펴봅니다

<p class="session-schedule-note">세션 시간과 장소는 추후 안내합니다.</p>
