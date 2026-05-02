import { Modal, Pressable, Text, View } from 'react-native';

import type {
  PredictionConfidence,
  PredictionResult,
} from '@/lib/prediction';

export interface PredictionReasoningModalProps {
  visible: boolean;
  prediction: PredictionResult | null;
  onClose: () => void;
}

const CONFIDENCE_LABEL: Record<PredictionConfidence, string> = {
  learning: '패턴 학습 중',
  low: '낮음',
  medium: '보통',
  high: '높음',
};

const CONFIDENCE_COPY: Record<PredictionConfidence, string> = {
  learning: '4회 미만의 수유 데이터로 표준값에만 의존하고 있어요. 기록이 쌓이면 더 정확해져요.',
  low: '4~6회의 데이터로 일부 개인 패턴을 반영하기 시작했어요.',
  medium: '7~13회의 데이터로 표준과 개인 패턴을 적절히 섞고 있어요.',
  high: '14회 이상의 충분한 데이터가 모여 개인 패턴 위주로 예측해요.',
};

/**
 * "왜 이렇게 예측했나요?" modal — explains the blended-average
 * algorithm transparently. Surfaces:
 *   - the interval the prediction used
 *   - confidence level (driven by sample size)
 *   - how many feeds contributed
 *
 * Spec: NextActionCard long-press triggers this. Acts as the
 * "no-black-box AI" promise users care about for parenting tools.
 */
export function PredictionReasoningModal({
  visible,
  prediction,
  onClose,
}: PredictionReasoningModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            gap: 14,
            width: '100%',
            maxWidth: 360,
          }}
        >
          <Text className="font-display text-[18px] font-medium" style={{ color: '#2A1D12' }}>
            왜 이렇게 예측했나요?
          </Text>

          {prediction ? (
            <>
              <Section
                label="다음 수유 간격"
                value={`${prediction.intervalMinutes}분`}
                hint="월령별 표준값과 우리 아기 최근 수유 평균을 가중평균한 결과예요."
              />
              <Section
                label="예측 확신도"
                value={CONFIDENCE_LABEL[prediction.confidence]}
                hint={CONFIDENCE_COPY[prediction.confidence]}
              />
              <Section
                label="반영된 수유 기록"
                value={`${prediction.basedOnFeedCount}회`}
                hint="최근 수유 기록의 간격을 평균해 개인 패턴을 만듭니다."
              />
            </>
          ) : (
            <Text className="font-body text-[13px]" style={{ color: '#8A7A63' }}>
              예측 정보를 불러오지 못했어요.
            </Text>
          )}

          <Text className="font-body text-[11px]" style={{ color: '#8A7A63', marginTop: 6 }}>
            ※ 예측은 일반적인 가이드일 뿐 의학적 진단은 아니에요. 컨디션이 처지면 소아과 상담을 권해요.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="확인하고 닫기"
            onPress={onClose}
            style={({ pressed }) => ({
              marginTop: 4,
              backgroundColor: pressed ? '#9E4621' : '#B85428',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            })}
          >
            <Text className="font-body text-[14px] font-medium" style={{ color: '#FFF8EF' }}>
              확인했어요
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Section({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text className="font-body text-[11px] uppercase tracking-[1.5px]" style={{ color: '#8A7A63' }}>
        {label}
      </Text>
      <Text className="font-display text-[16px] font-medium" style={{ color: '#2A1D12' }}>
        {value}
      </Text>
      <Text className="font-body text-[12px]" style={{ color: '#5C4A37', lineHeight: 12 * 1.6 }}>
        {hint}
      </Text>
    </View>
  );
}
