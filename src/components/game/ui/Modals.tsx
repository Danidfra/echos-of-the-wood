import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lock, Sparkles, Eye, BookOpen, Heart, LogOut } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * LoginRequiredModal
 *
 * Shown when a non-logged user tries to interact with a spirit.
 */
export function LoginRequiredModal({ open, onOpenChange }: ModalProps) {
  const { extension } = useLoginActions();

  const handleLogin = async () => {
    try {
      await extension();
      onOpenChange(false);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-forest-modal border-spirit-glow/30 text-spirit-light max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Sparkles className="w-12 h-12 text-spirit-glow animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-spirit-glow/30 rounded-full" />
            </div>
          </div>
          <DialogTitle className="font-cinzel text-2xl text-center text-spirit-light">
            Connect with the Forest
          </DialogTitle>
          <DialogDescription className="text-center text-spirit-light/70 font-cormorant text-lg pt-2">
            To begin your journey and register your connection with the forest spirits,
            please log in with a Nostr account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={handleLogin}
            className="w-full bg-spirit-glow/20 hover:bg-spirit-glow/30 text-spirit-light border border-spirit-glow/40 hover:border-spirit-glow/60 font-cinzel"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Login with Nostr
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-spirit-light/60 hover:text-spirit-light hover:bg-spirit-glow/10"
          >
            Continue exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * AccountModal
 *
 * Shows user account information, stats, and settings.
 */
export function AccountModal({ open, onOpenChange }: ModalProps) {
  const { user } = useCurrentUser();
  const { logout } = useLoginActions();

  const shortenedPubkey = user?.pubkey
    ? `${user.pubkey.slice(0, 8)}...${user.pubkey.slice(-8)}`
    : 'Not connected';

  const handleLogout = async () => {
    await logout();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-forest-modal border-spirit-glow/30 text-spirit-light max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl text-center text-spirit-light">
            Your Journey
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Pubkey display */}
          <div className="p-4 rounded-lg bg-forest-dark/50 border border-spirit-glow/20">
            <p className="text-xs text-spirit-muted mb-1 font-cormorant">Your Nostr Identity</p>
            <p className="font-mono text-sm text-spirit-light/80 break-all">
              {shortenedPubkey}
            </p>
          </div>

          <Separator className="bg-spirit-glow/20" />

          {/* Stats */}
          <div className="space-y-4">
            <h3 className="font-cinzel text-lg text-spirit-light/90">Forest Statistics</h3>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Eye className="w-5 h-5" />}
                label="Spirits Seen Today"
                value="—"
                placeholder
              />
              <StatCard
                icon={<BookOpen className="w-5 h-5" />}
                label="Spirits Registered"
                value="—"
                placeholder
              />
            </div>
          </div>

          <Separator className="bg-spirit-glow/20" />

          {/* Badges */}
          <div className="space-y-3">
            <h3 className="font-cinzel text-lg text-spirit-light/90">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-spirit-glow/30 text-spirit-muted">
                <Lock className="w-3 h-3 mr-1" /> Coming soon
              </Badge>
            </div>
          </div>

          <Separator className="bg-spirit-glow/20" />

          {/* Logout button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder?: boolean;
}

function StatCard({ icon, label, value, placeholder }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-forest-dark/30 border border-spirit-glow/10">
      <div className={`flex items-center gap-2 mb-1 ${placeholder ? 'text-spirit-muted' : 'text-spirit-glow'}`}>
        {icon}
        <span className="text-xs font-cormorant">{label}</span>
      </div>
      <p className={`text-2xl font-cinzel ${placeholder ? 'text-spirit-muted' : 'text-spirit-light'}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * AchievementsModal
 *
 * Shows placeholder achievements for future implementation.
 */
export function AchievementsModal({ open, onOpenChange }: ModalProps) {
  const achievements = [
    {
      id: 'first-spirit-seen',
      title: 'First Spirit Seen',
      description: 'Observe your first forest spirit',
      icon: <Eye className="w-5 h-5" />,
      locked: true,
    },
    {
      id: 'first-spirit-registered',
      title: 'First Spirit Registered',
      description: 'Successfully register a spirit to your journal',
      icon: <BookOpen className="w-5 h-5" />,
      locked: true,
    },
    {
      id: 'friend-of-fae',
      title: 'Friend of the Fae',
      description: 'Form a deep connection with 10 different spirits',
      icon: <Heart className="w-5 h-5" />,
      locked: true,
    },
    {
      id: 'night-watcher',
      title: 'Night Watcher',
      description: 'Observe spirits during the midnight hour',
      icon: <Sparkles className="w-5 h-5" />,
      locked: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-forest-modal border-spirit-glow/30 text-spirit-light max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl text-center text-spirit-light">
            Achievements
          </DialogTitle>
          <DialogDescription className="text-center text-spirit-light/60 font-cormorant">
            Your progress through the enchanted forest
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4 max-h-80 overflow-y-auto pr-2">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border transition-colors ${
                achievement.locked
                  ? 'bg-forest-dark/30 border-spirit-glow/10 opacity-60'
                  : 'bg-spirit-glow/10 border-spirit-glow/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  achievement.locked
                    ? 'bg-forest-dark/50 text-spirit-muted'
                    : 'bg-spirit-glow/20 text-spirit-glow'
                }`}>
                  {achievement.locked ? <Lock className="w-5 h-5" /> : achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-cinzel ${
                    achievement.locked ? 'text-spirit-muted' : 'text-spirit-light'
                  }`}>
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-spirit-light/50 font-cormorant">
                    {achievement.description}
                  </p>
                </div>
                {achievement.locked && (
                  <Badge variant="outline" className="border-spirit-muted/30 text-spirit-muted text-xs">
                    Locked
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
