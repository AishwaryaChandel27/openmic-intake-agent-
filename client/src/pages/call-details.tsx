import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Calendar, Download, Phone } from "lucide-react";
import { Link } from "wouter";
import type { CallWithDetails } from "@shared/schema";

export default function CallDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: call, isLoading } = useQuery<CallWithDetails>({
    queryKey: ["/api/calls", id],
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading call details...</div>
        </main>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Call not found</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case "crisis":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "distress":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "positive":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <Header />
          
          <div className="flex-1 p-6 overflow-auto">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline" size="sm" data-testid="button-back-to-dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Call Details</h2>
                  <p className="text-muted-foreground">
                    {call.patient?.name || "Unknown Patient"} • {call.timestamp ? new Date(call.timestamp).toLocaleString() : "Unknown Date"}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" data-testid="button-schedule-followup">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Follow-up
                </Button>
                <Button variant="outline" data-testid="button-export-report">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                {call.flags.some(flag => flag.severity === "high") && (
                  <Button variant="destructive" data-testid="button-emergency-protocol">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Emergency Protocol
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Patient Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="text-foreground" data-testid="text-patient-name">
                          {call.patient?.name || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                        <p className="text-foreground" data-testid="text-patient-id">
                          {call.patientId || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Appointment</p>
                        <p className="text-foreground" data-testid="text-last-appointment">
                          {call.patient?.lastAppointment || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Topic</p>
                        <p className="text-foreground" data-testid="text-last-topic">
                          {call.patient?.lastTopic || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Call Transcript */}
                <Card>
                  <CardHeader>
                    <CardTitle>Full Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background rounded-lg p-4 max-h-96 overflow-y-auto space-y-4 border">
                      {call.transcript ? (
                        <div className="whitespace-pre-wrap text-sm" data-testid="text-transcript">
                          {call.transcript}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No transcript available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* API Calls Made */}
                {call.apiCalls.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>API Calls Made During Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {call.apiCalls.map((apiCall, index) => (
                          <div key={apiCall.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{apiCall.endpoint}</span>
                              <span className="text-xs text-muted-foreground">
                                {apiCall.timestamp ? new Date(apiCall.timestamp).toLocaleTimeString() : "Unknown time"}
                              </span>
                            </div>
                            <div className="text-xs">
                              <p className="text-muted-foreground mb-1">Request Data:</p>
                              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(apiCall.requestData, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Call Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Call Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="text-foreground" data-testid="text-call-duration">
                        {call.duration ? formatDuration(call.duration) : "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getSentimentColor(call.sentimentLabel || "neutral")} data-testid="badge-call-status">
                        {call.status || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sentiment:</span>
                      <span className="text-foreground" data-testid="text-sentiment">
                        {call.sentimentLabel || "Unknown"} ({call.sentimentScore || "N/A"})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bot Used:</span>
                      <span className="text-foreground" data-testid="text-bot-name">
                        {call.bot?.name || "Unknown Bot"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Crisis Flags */}
                {call.flags.length > 0 && (
                  <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                      <CardTitle className="text-destructive flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Crisis Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {call.flags.map((flag) => (
                          <div key={flag.id} className="border rounded-lg p-3 bg-background">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-destructive">
                                {flag.flagType}
                              </span>
                              <Badge 
                                variant={flag.severity === "high" ? "destructive" : "outline"}
                                data-testid={`badge-flag-severity-${flag.id}`}
                              >
                                {flag.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{flag.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resources Provided</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-background rounded border">
                        <i className="fas fa-file-alt text-primary" />
                        <span className="text-sm">Coping with Anxiety</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-background rounded border">
                        <Phone className="w-4 h-4 text-destructive" />
                        <span className="text-sm">24x7 Crisis Hotline</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
