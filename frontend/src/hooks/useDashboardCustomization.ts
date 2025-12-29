import { useState, useCallback, useEffect } from 'react';

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stats' | 'table' | 'timeline' | 'alerts' | 'activity';
  title: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  config?: Record<string, any>;
  isVisible: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

const STORAGE_KEY = 'dashboard_layouts';
const ACTIVE_LAYOUT_KEY = 'active_dashboard_layout';

export const useDashboardCustomization = (userId: string) => {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load layouts from localStorage
  useEffect(() => {
    const loadLayouts = () => {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
        const activeId = localStorage.getItem(`${ACTIVE_LAYOUT_KEY}_${userId}`);
        
        if (stored) {
          const parsedLayouts = JSON.parse(stored);
          setLayouts(parsedLayouts);
          setActiveLayoutId(activeId || parsedLayouts[0]?.id || '');
        } else {
          // Initialize with default layout
          const defaultLayout = createDefaultLayout();
          setLayouts([defaultLayout]);
          setActiveLayoutId(defaultLayout.id);
        }
      } catch (error) {
        console.error('Failed to load dashboard layouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayouts();
  }, [userId]);

  // Save layouts to localStorage
  const saveLayouts = useCallback((newLayouts: DashboardLayout[]) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(newLayouts));
      setLayouts(newLayouts);
    } catch (error) {
      console.error('Failed to save dashboard layouts:', error);
    }
  }, [userId]);

  // Save active layout ID
  const saveActiveLayoutId = useCallback((layoutId: string) => {
    try {
      localStorage.setItem(`${ACTIVE_LAYOUT_KEY}_${userId}`, layoutId);
      setActiveLayoutId(layoutId);
    } catch (error) {
      console.error('Failed to save active layout ID:', error);
    }
  }, [userId]);

  // Create a new layout
  const createLayout = useCallback((name: string) => {
    const newLayout: DashboardLayout = {
      id: `layout_${Date.now()}`,
      name,
      widgets: createDefaultLayout().widgets,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false,
    };
    const updated = [...layouts, newLayout];
    saveLayouts(updated);
    return newLayout;
  }, [layouts, saveLayouts]);

  // Update layout
  const updateLayout = useCallback((layoutId: string, updates: Partial<DashboardLayout>) => {
    const updated = layouts.map(layout =>
      layout.id === layoutId
        ? { ...layout, ...updates, updatedAt: new Date() }
        : layout
    );
    saveLayouts(updated);
  }, [layouts, saveLayouts]);

  // Delete layout
  const deleteLayout = useCallback((layoutId: string) => {
    if (layouts.length <= 1) {
      console.warn('Cannot delete the last layout');
      return;
    }
    const updated = layouts.filter(layout => layout.id !== layoutId);
    saveLayouts(updated);
    if (activeLayoutId === layoutId) {
      saveActiveLayoutId(updated[0].id);
    }
  }, [layouts, activeLayoutId, saveLayouts, saveActiveLayoutId]);

  // Add widget to layout
  const addWidget = useCallback((layoutId: string, widget: DashboardWidget) => {
    updateLayout(layoutId, {
      widgets: [...(layouts.find(l => l.id === layoutId)?.widgets || []), widget],
    });
  }, [layouts, updateLayout]);

  // Remove widget from layout
  const removeWidget = useCallback((layoutId: string, widgetId: string) => {
    const layout = layouts.find(l => l.id === layoutId);
    if (layout) {
      updateLayout(layoutId, {
        widgets: layout.widgets.filter(w => w.id !== widgetId),
      });
    }
  }, [layouts, updateLayout]);

  // Update widget
  const updateWidget = useCallback((layoutId: string, widgetId: string, updates: Partial<DashboardWidget>) => {
    const layout = layouts.find(l => l.id === layoutId);
    if (layout) {
      updateLayout(layoutId, {
        widgets: layout.widgets.map(w =>
          w.id === widgetId ? { ...w, ...updates } : w
        ),
      });
    }
  }, [layouts, updateLayout]);

  // Reorder widgets
  const reorderWidgets = useCallback((layoutId: string, newOrder: DashboardWidget[]) => {
    updateLayout(layoutId, { widgets: newOrder });
  }, [updateLayout]);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((layoutId: string, widgetId: string) => {
    const layout = layouts.find(l => l.id === layoutId);
    if (layout) {
      updateLayout(layoutId, {
        widgets: layout.widgets.map(w =>
          w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
        ),
      });
    }
  }, [layouts, updateLayout]);

  // Get active layout
  const activeLayout = layouts.find(l => l.id === activeLayoutId);

  return {
    layouts,
    activeLayout,
    activeLayoutId,
    isLoading,
    createLayout,
    updateLayout,
    deleteLayout,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    toggleWidgetVisibility,
    setActiveLayout: saveActiveLayoutId,
  };
};

// Helper function to create default layout
function createDefaultLayout(): DashboardLayout {
  return {
    id: `layout_${Date.now()}`,
    name: 'Default Dashboard',
    widgets: [
      {
        id: 'widget_stats_1',
        type: 'stats',
        title: 'Total Exports',
        position: 0,
        size: 'small',
        isVisible: true,
      },
      {
        id: 'widget_stats_2',
        type: 'stats',
        title: 'Pending Approvals',
        position: 1,
        size: 'small',
        isVisible: true,
      },
      {
        id: 'widget_stats_3',
        type: 'stats',
        title: 'Completed',
        position: 2,
        size: 'small',
        isVisible: true,
      },
      {
        id: 'widget_chart_1',
        type: 'chart',
        title: 'Export Trends',
        position: 3,
        size: 'large',
        isVisible: true,
      },
      {
        id: 'widget_table_1',
        type: 'table',
        title: 'Recent Exports',
        position: 4,
        size: 'large',
        isVisible: true,
      },
      {
        id: 'widget_alerts_1',
        type: 'alerts',
        title: 'System Alerts',
        position: 5,
        size: 'medium',
        isVisible: true,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true,
  };
}
