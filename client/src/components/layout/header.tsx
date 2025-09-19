import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

interface HeaderProps {
  onCreateBot?: () => void;
}

export default function Header({ onCreateBot }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mental Health Triage Dashboard</h2>
          <p className="text-muted-foreground">Monitor patient interactions and manage crisis interventions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>
          </div>
          {onCreateBot && (
            <Button 
              onClick={onCreateBot}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-create-bot"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
