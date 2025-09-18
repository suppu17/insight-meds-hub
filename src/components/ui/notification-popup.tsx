import React from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

interface NotificationPopupProps {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  error: AlertTriangle,
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  error: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    icon: 'text-destructive',
    title: 'text-destructive',
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    icon: 'text-success',
    title: 'text-success',
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    icon: 'text-primary',
    title: 'text-primary',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    icon: 'text-warning',
    title: 'text-warning',
  },
};

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  actionButton,
}) => {
  if (!isOpen) return null;

  const IconComponent = iconMap[type];
  const colors = colorMap[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`glass-card max-w-md w-full p-6 border-2 ${colors.bg} ${colors.border} animate-in fade-in-0 slide-in-from-bottom-4 duration-300`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${colors.bg} flex-shrink-0`}>
            <IconComponent className={`w-5 h-5 ${colors.icon}`} />
          </div>

          <div className="flex-1 space-y-2">
            <h3 className={`font-semibold ${colors.title}`}>{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>

            <div className="flex gap-2 pt-2">
              {actionButton && (
                <Button
                  size="sm"
                  onClick={actionButton.onClick}
                  className="mr-2"
                >
                  {actionButton.label}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="ml-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;