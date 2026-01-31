'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AppLog {
  id: string;
  created_at: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  details: any;
  user_id: string | null;
  platform: string | null;
  version: string | null;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) console.error('Error fetching logs:', error);
    else setLogs(data as AppLog[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    
    // Realtime subscription
    const channel = supabase
      .channel('app_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_logs',
        },
        (payload) => {
          setLogs((current) => [payload.new as AppLog, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive'; // Use destructive for error too or similar
      case 'warn': return 'warning'; // If warning variant exists, else secondary
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sentinel Logs"
        description="Gerçek zamanlı hata ve sistem kayıtları."
        action={<Button onClick={fetchLogs} variant="outline">Yenile</Button>}
      />

      <Card>
        <CardHeader title="Live Events" description="Son 50 kayıt" />
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Zaman</TableHead>
                  <TableHead className="w-[100px]">Level</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead className="w-[100px]">Platform</TableHead>
                  <TableHead className="w-[100px]">User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && !loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Log kaydı bulunamadı.</TableCell>
                    </TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => console.log(log.details)}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.created_at).toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelColor(log.level) as any}>
                        {log.level.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{log.message}</div>
                        {log.details && (
                            <div className="text-xs text-muted-foreground truncate max-w-[400px]">
                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                            </div>
                        )}
                    </TableCell>
                    <TableCell>{log.platform || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.user_id?.slice(0, 8)}...</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
