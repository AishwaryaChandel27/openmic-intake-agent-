import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, AlertTriangle, Calendar, Download, Phone, FileText } from "lucide-react";
import { Link } from "wouter";
import type { CallWithDetails } from "@shared/schema";

interface CallDetailsSidebarProps {
  call: CallWithDetails;
  onClose: () => void;
}

export default function CallDetailsSidebar({ call, onClose }: CallDetailsSidebarProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const isCrisis = call.status === "crisis" || call.flags.some(flag => flag.severity === "high");

  return (
    <aside className="w-96 bg-card border-l border-border overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Call Details</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Patient Info Card */}
        <Card className={`mb-6 ${isCrisis ? "bg-destructive/5 border-destructive/20" : "bg-muted/50"}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isCrisis ? "bg-destructive/10" : "bg-primary/10"
              }`}>
                <span className={`font-semibold ${isCrisis ? "text-destructive" : "text-primary"}`}>
                  {call.patient?.name?.split(' ').map(n => n[0]).join('') || 'UN'}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground" data-testid="text-sidebar-patient-name">
                  {call.patient?.name || "Unknown Patient"}
                </h4>
                <p className="text-sm text-muted-foreground" data-testid="text-sidebar-patient-id">
                  Patient ID: {call.patientId || "Unknown"}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Appointment:</span>
                <span className="text-foreground" data-testid="text-sidebar-last-appointment">
                  {call.patient?.lastAppointment || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Topic:</span>
                <span className="text-foreground" data-testid="text-sidebar-last-topic">
                  {call.patient?.lastTopic || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Level:</span>
                <span className={isCrisis ? "text-destructive font-medium" : "text-secondary"}>
                  {call.patient?.riskLevel || "Unknown"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crisis Flags Alert */}
        {call.flags.length > 0 && (
          <Card className="mb-6 bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-destructive mt-0.5 w-5 h-5" />
                <div className="flex-1">
                  <h5 className="font-semibold text-destructive mb-2">Crisis Flags Detected</h5>
                  <div className="space-y-2">
                    {call.flags.map((flag) => (
                      <div key={flag.id} className="flex items-center justify-between text-sm">
                        <span className="text-destructive">{flag.flagType}</span>
                        <Badge 
                          variant={flag.severity === "high" ? "destructive" : "outline"}
                          className="text-xs"
                          data-testid={`badge-sidebar-flag-${flag.id}`}
                        >
                          {flag.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="mt-3 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    size="sm"
                    data-testid="button-escalate-supervisor"
                  >
                    Escalate to Supervisor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call Summary */}
        <div className="mb-6">
          <h5 className="font-semibold text-foreground mb-3">Call Summary</h5>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="text-foreground" data-testid="text-sidebar-duration">
                {call.duration ? formatDuration(call.duration) : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sentiment Score:</span>
              <span className={`font-medium ${isCrisis ? "text-destructive" : "text-foreground"}`}>
                {call.sentimentScore ? `${call.sentimentScore} (${call.sentimentLabel})` : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bot Used:</span>
              <span className="text-foreground" data-testid="text-sidebar-bot">
                {call.bot?.name || "Unknown Bot"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Calls Made:</span>
              <span className="text-foreground" data-testid="text-sidebar-api-calls">
                {call.apiCalls.length}
              </span>
            </div>
          </div>
        </div>

        {/* Transcript Preview */}
        <div className="mb-6">
          <h5 className="font-semibold text-foreground mb-3">Transcript Preview</h5>
          <div className="bg-background rounded-lg p-4 max-h-64 overflow-y-auto text-sm border">
            {call.transcript ? (
              <div className="space-y-3">
                <div className="whitespace-pre-wrap" data-testid="text-sidebar-transcript">
                  {call.transcript.length > 300 
                    ? `${call.transcript.substring(0, 300)}...` 
                    : call.transcript
                  }
                </div>
                {call.transcript.length > 300 && (
                  <Link href={`/calls/${call.id}`}>
                    <Button variant="link" className="p-0 h-auto text-primary" data-testid="link-full-transcript">
                      View Full Transcript →
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No transcript available</p>
            )}
          </div>
        </div>

        {/* Resources Provided */}
        <div className="mb-6">
          <h5 className="font-semibold text-foreground mb-3">Resources Provided</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2 p-2 bg-background rounded border">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-foreground">Coping with Anxiety</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-background rounded border">
              <Phone className="w-4 h-4 text-destructive" />
              <span className="text-foreground">24x7 Crisis Hotline</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isCrisis && (
            <Button 
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              data-testid="button-emergency-protocol"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Initiate Emergency Protocol
            </Button>
          )}
          
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-schedule-followup"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Follow-up
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            data-testid="button-export-report"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </aside>
  );
}
