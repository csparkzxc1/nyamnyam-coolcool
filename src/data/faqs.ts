/**
 * FAQ content for the Guide tab — 10 questions newborn parents commonly
 * ask in the first 6 months. Answers are intentionally observational
 * and steer toward "patterns vary, when to seek help" rather than
 * giving a diagnosis (CLAUDE.md §11.9).
 *
 * The numeric ranges quoted in answers come from the same sources the
 * Guide standards table cites — 보건복지부 아이사랑, AAP, AASM 2016.
 */

export interface FAQ {
  id: string;
  question: string;
  /** Multi-paragraph answer; rendered with line height 1.6 in the UI. */
  answer: string;
}

export const FAQS: readonly FAQ[] = [
  {
    id: 'wake-frequent',
    question: '신생아는 왜 이렇게 자주 깨나요?',
    answer:
      '0~3개월 아기는 50~60분짜리 짧은 수면 주기가 한 번씩 끝날 때마다 잠깐 깨는 게 자연스러운 패턴이에요. 위가 작아 2~3시간마다 수유가 필요한 점도 한몫해요. 4개월쯤 수면 주기가 안정되면서 통잠 구간이 조금씩 늘어나요.',
  },
  {
    id: 'feed-interval-short',
    question: '수유 텀이 자꾸 짧아져요. 정상인가요?',
    answer:
      '아기는 갑자기 평소보다 자주 먹는 "성장 급증기(growth spurt)"를 3주·6주·3개월·6개월 무렵 짧게 겪어요. 이 시기에 텀이 30분~1시간 짧아지는 건 흔해요. 며칠 지나면 다시 원래 텀으로 돌아오는 경우가 많으니 며칠 기록을 더 보고 판단해 주세요.',
  },
  {
    id: 'breast-vs-formula',
    question: '모유와 분유, 잠 패턴이 다른가요?',
    answer:
      '분유는 소화가 조금 더 천천히 이루어져 평균 수유 텀이 약간 길어지는 경향이 있어요. 모유 수유 아기는 텀이 좀 더 짧지만 잠은 깊게 자는 경우가 많아요. 어느 쪽이든 충분히 먹고 잘 크고 있다면 정답은 없어요.',
  },
  {
    id: 'long-nap',
    question: '낮잠이 너무 길어요. 깨워야 할까요?',
    answer:
      '낮잠 한 번이 2시간 30분을 넘기면 밤잠 시작이 늦어지거나 수유 횟수가 부족해질 수 있어요. 0~1개월은 4시간을 넘기지 말고 깨워서 수유해 주세요. 4개월 이상은 늦은 오후 낮잠만 짧게 끊어 주는 정도로도 도움이 돼요.',
  },
  {
    id: 'burp',
    question: '트림은 꼭 시켜야 하나요?',
    answer:
      '특히 분유 수유 아기는 공기를 같이 삼키기 쉬워서 수유 후 5~10분 트림이 도움이 돼요. 모유 수유는 공기 흡입이 적어 트림이 안 나와도 괜찮은 경우가 많아요. 토를 자주 한다면 시간을 좀 더 길게 잡아 주세요.',
  },
  {
    id: 'sleep-training',
    question: '수면교육은 언제부터 시작하나요?',
    answer:
      '수면 리듬이 자리 잡는 4개월 무렵부터 천천히 시작하는 게 일반적이에요. 그 전에는 일정한 수면 환경(어두움·일정한 자장가·온도)을 만들어 주는 정도로 충분해요. 역류·체중 부족·황달 등 의학적 이슈가 있다면 먼저 소아과 상담이 필요해요.',
  },
  {
    id: 'sleep-through',
    question: '통잠은 언제부터 자나요?',
    answer:
      '연속 5시간 이상의 수면을 "통잠"이라고 봤을 때, 4~6개월 사이에 처음 시작하는 아기가 많아요. 다만 개인차가 커서 1년이 지나서야 안정되는 경우도 흔해요. 낮 수유량과 활동량이 충분한지, 잠자리 환경이 일정한지부터 살펴봐 주세요.',
  },
  {
    id: 'diaper-count',
    question: '하루 소변 기저귀가 몇 장이면 충분한가요?',
    answer:
      '생후 1주 이후에는 24시간 동안 소변 기저귀 6장 이상이 일반적인 기준이에요. 6장 미만이거나 소변 색이 진한 노란빛이라면 수분 섭취가 부족할 수 있어요. 24시간 이상 지속되면 소아과 진료를 권해요.',
  },
  {
    id: 'underfeeding',
    question: '우리 아기가 너무 적게 먹는 것 같아요',
    answer:
      '한 끼 양에 일희일비하지 말고 24시간 총량으로 보세요. 체중이 꾸준히 늘고 있고, 소변 기저귀가 6장 이상이며, 컨디션이 좋다면 충분히 먹는 거예요. 3일 이상 컨디션이 처지거나 체중이 정체된다면 소아과 상담을 권해요.',
  },
  {
    id: 'parent-fatigue',
    question: '저도 잠이 부족해서 너무 힘들어요',
    answer:
      '산후 6주 이내 초보엄마의 80% 이상이 같은 어려움을 겪어요. 가능하면 아기가 자는 시간 30분만이라도 함께 누워 쉬어 주세요. 2주 이상 우울감·무기력이 지속되거나 일상이 힘들다면 산후우울 상담전화 1577-0199로 도움을 받을 수 있어요.',
  },
];
