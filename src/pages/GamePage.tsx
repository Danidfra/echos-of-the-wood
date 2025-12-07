import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SceneViewport } from '@/components/game/SceneViewport';
import { SpiritClickPayload } from '@/components/game/layers/SpiritLayer';
import { GameHUD } from '@/components/game/ui/GameHUD';
import {
  LoginRequiredModal,
  AccountModal,
  AchievementsModal
} from '@/components/game/ui/Modals';
import { RotateDeviceOverlay } from '@/components/game/ui/RotateDeviceOverlay';

export default function GamePage() {
  const { user } = useCurrentUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  const handleSpiritClick = (payload: SpiritClickPayload) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      console.log("Spirit clicked", payload);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-dark via-forest-mid to-forest-deep">
      {/* Rotate device overlay for portrait mode on mobile */}
      <RotateDeviceOverlay />

      {/* Main game container */}
      <div className="flex flex-col h-screen p-4 md:p-6">
        {/* Top HUD */}
        <GameHUD
          onAccountClick={() => setShowAccountModal(true)}
          onAchievementsClick={() => setShowAchievementsModal(true)}
        />

        {/* Game viewport container */}
        <div className="flex-1 flex items-center justify-center py-4">
          <SceneViewport onSpiritClick={handleSpiritClick} />
        </div>
      </div>

      {/* Modals */}
      <LoginRequiredModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
      <AccountModal
        open={showAccountModal}
        onOpenChange={setShowAccountModal}
      />
      <AchievementsModal
        open={showAchievementsModal}
        onOpenChange={setShowAchievementsModal}
      />
    </div>
  );
}
