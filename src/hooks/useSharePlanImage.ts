import {useRef, useState, useCallback} from 'react';
import {Alert, Platform} from 'react-native';
import Share from 'react-native-share';
import {useTranslation} from 'react-i18next';
import {Plan} from '../types';

export const useSharePlanImage = () => {
  const viewShotRef = useRef<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const {t} = useTranslation();

  const sharePlanAsImage = useCallback(
    async (_plan: Plan) => {
      if (!viewShotRef.current) return;

      setIsGenerating(true);
      try {
        // Wait for the offscreen view to finish layout
        await new Promise(resolve => setTimeout(resolve, 100));

        const capture = (viewShotRef.current as any).capture;
        if (!capture) return;

        const uri: string = await capture();
        const fileUrl =
          Platform.OS === 'android' ? `file://${uri}` : uri;

        await Share.open({
          url: fileUrl,
          type: 'image/png',
          title: t('plan.shareTitle'),
        });
      } catch (error: any) {
        // User cancelled share — not an error
        if (
          error?.message?.includes('User did not share') ||
          error?.message?.includes('cancel')
        ) {
          return;
        }
        Alert.alert(t('common.error'), t('plan.shareError'));
      } finally {
        setIsGenerating(false);
      }
    },
    [t],
  );

  return {viewShotRef, isGenerating, sharePlanAsImage};
};
