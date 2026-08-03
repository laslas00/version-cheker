    function exportToCSV() {
      if (filteredData.length === 0) {
        alert('No data to export');
        return;
      }
      
      const headers = ['created_at','event_type','username','device_id','country','city','latitude','longitude','event_data'];
      const rows = filteredData.map(e => [
        e.created_at, 
        e.event_type, 
        e.username||'', 
        e.device_id||'', 
        e.country||'', 
        e.city||'',
        e.latitude||'',
        e.longitude||'',
        JSON.stringify(e.event_data||{})
      ]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stockapp_events_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
