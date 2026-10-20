Title: 김평권
Description: "김평권 - AI는 데이터 정합성을 소유하지 않는다. Azure 기반 AI-native Document Transformation 아키텍쳐 설계"
SpeakerAffiliation: "프리랜서"
SpeakerPhoto: /images/speakers/pyeonggwonkim.jpg
---
## 발표자 소개

현 MCT, Avanade 경력, Microsoft ISV Marketplace 아키텍쳐 컨설팅, Microsoft 프리세일즈 기술 지원 경력

## 세션 정보

### AI는 데이터 정합성을 소유하지 않는다. Azure 기반 AI-native Document Transformation 아키텍쳐 설계

글로벌 기업은 같은 문서를 여러 언어로 만듭니다. LLM은 문장을 잘 번역하지만 원본을 지키는 데는 약합니다. 표, 도형, 슬라이드 레이아웃, 스타일, 민감도 레이블은 번역 과정에서 깨지거나 사라지고, 결국 사람이 PowerPoint와 Word를 열어 다시 고칩니다. 언어가 하나 늘 때마다 이 작업이 반복됩니다.

Localization.md는 이 문제를 풀기 위해 만든 Azure 기반 AI-native Document Transformation 플랫폼입니다. AI는 내용을 바꾸고, 원본과 결과 사이의 데이터 정합성은 아키텍처가 책임집니다.

이 세션에서는 이 서비스들을 같은 기반 위에 쌓아 올린 아키텍처, 즉 서비스가 늘어도 기존 코드를 수정하지 않도록 설계한 구조를 다룹니다.

**1. AI에게는 내용만 건넨다**

포맷별 importer가 DOCX, PPTX, PDF, EPUB을 uni-json IR로 변환하면서 원본 OOXML 조각과 relationship을 sidecar로 보존합니다. LLM은 텍스트만 다루고, 변경은 JSON Patch로 기록된 뒤 원본 포맷으로 export됩니다. glossary의 보호 용어와 Translation Memory는 문서가 달라도 같은 용어가 같은 번역으로 나오도록 고정합니다.

**2. 늘어난 문장은 원래 자리로**

번역으로 길이가 달라진 텍스트를 고정된 박스에 맞추기 위해 길이 예산, 폰트 축소, 넘침 판정을 하나의 부등식(κ, φ\^d ≤ 1/e)으로 통합했습니다. QA는 미번역, overflow, clipping, overlap, font fallback을 검출하고, Repair는 원본을 건드리지 않고 별도 결과물을 만듭니다. 안전 기준에 못 미치는 항목은 자동 수정하지 않고 사유와 confidence를 남겨 사람의 검토로 넘깁니다.

**3. 기능이 늘어도 기준은 하나**

제품 코드는 ILLMProvider, IStorage, IJobQueue, IVectorStore 포트만 호출하고, 어댑터가 Azure OpenAI, PostgreSQL Flexible Server(pgvector), Blob Storage, Key Vault에 Managed Identity로 연결합니다. 서비스는 manifest 선언만으로 BFF에 조립되며, 번역, 스캔, 이력은 tenant 단위로 고정된 하나의 문서 원장을 공유합니다. 서비스가 추가되어도 공용 코드와 데이터 기준은 바뀌지 않습니다.

**4. 원본이 있던 곳으로, 원래의 보호 그대로**

Entra ID(External ID, Workforce, OBO flow)와 Microsoft Graph로 SPFx ListView Command Set, Teams message extension, Power Automate custom connector를 같은 gateway API에 연결하고, 결과물은 원본과 같은 SharePoint 폴더에 저장합니다. MIP 민감도 레이블 문서는 복호화 후 번역하고 원본과 같은 레이블로 재보호합니다. 평문은 job 범위 임시 파일로만 존재하고 처리 직후 삭제되며, 문서 본문은 egress allowlist로 외부 전송이 차단됩니다.

**5. 한계는 코드가 아니라 인프라가 정한다**

Azure OpenAI 429 장애 61건을 Azure Monitor 메트릭만으로 추적한 과정을 공유합니다. 원인은 호출당 약 9,000토큰에 비해 작은 TPM 한도, 전역 동시성 상한의 부재, in-memory job store였습니다. 이를 계기로 job 상태를 PostgreSQL과 Blob Storage로 옮기고, 워커를 Container Apps와 KEDA로 이관해 처리량 상한을 인프라가 결정하도록 바꾸는 설계를 다룹니다.

<p class="session-schedule-note">세션 시간과 장소는 추후 안내합니다.</p>
