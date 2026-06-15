-- =====================================================================
-- ClickHub / NexHub RLS Enablement & Role-Based Access Control Policies
-- =====================================================================

-- 1. Helper function to get current user's role from public."User" table
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public."User" WHERE id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Enable RLS on all 44 tables in public schema
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'Article', 'Asset', 'AssetComponentHistory', 'AssetMaintenanceLog', 'AssignedAsset', 
        'Attachment', 'AuditLog', 'Category', 'ChatMessage', 'ChatSession', 'Checklist', 
        'CheckoutItem', 'Comment', 'DirectoryCategory', 'DirectoryEntry', 'EquipmentCheckout', 
        'GoodsReceipt', 'Holiday', 'Inventory', 'InventoryTransaction', 'Location', 
        'MaintenanceSchedule', 'MasterData', 'MenuPermission', 'Notification', 'PartRequest', 
        'Permission', 'PurchaseRequest', 'RelocationHistory', 'ReplacementRequest', 'RolePermission', 
        'StockAdjustmentRequest', 'StockOpname', 'StockOpnameItem', 'StockRequest', 'SystemSetting', 
        'SystemSettings', 'Task', 'TeamMessage', 'Ticket', 'User', 'WorkNote', 'Space', 'TaskList'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public."%s" ENABLE ROW LEVEL SECURITY;', t);
        
        -- Drop any existing general policies on the table to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated read" ON public."%s";', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow staff write" ON public."%s";', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow employee self-read/write" ON public."%s";', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all authenticated CRUD" ON public."%s";', t);
    END LOOP;
END;
$$;

-- 3. Define Security Policies

-- A. Table: User
CREATE POLICY "Allow authenticated read Users" ON public."User"
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write Users" ON public."User"
    FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT'));

-- B. Table: Ticket
CREATE POLICY "Allow authenticated read Tickets" ON public."Ticket"
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow employee create Tickets" ON public."Ticket"
    FOR INSERT TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow employee update own Tickets" ON public."Ticket"
    FOR UPDATE TO authenticated 
    USING ("reporterId" = auth.uid()::text OR public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow admin delete Tickets" ON public."Ticket"
    FOR DELETE TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT'));

-- C. Table: Task, Checklist, TaskList, Space
CREATE POLICY "Allow authenticated read Tasks" ON public."Task" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff write Tasks" ON public."Task" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow authenticated read Checklist" ON public."Checklist" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff write Checklist" ON public."Checklist" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow authenticated read Space" ON public."Space" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin write Space" ON public."Space" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT'));

CREATE POLICY "Allow authenticated read TaskList" ON public."TaskList" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin write TaskList" ON public."TaskList" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT'));

-- D. Table: Comment
CREATE POLICY "Allow authenticated read Comments" ON public."Comment"
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated create Comments" ON public."Comment"
    FOR INSERT TO authenticated 
    WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Allow author update/delete own Comments" ON public."Comment"
    FOR ALL TO authenticated 
    USING ("userId" = auth.uid()::text OR public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER'));

-- E. Table: Asset, Inventory, InventoryTransaction, MaintenanceSchedule
CREATE POLICY "Allow authenticated read Assets" ON public."Asset" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff write Assets" ON public."Asset" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow authenticated read Inventory" ON public."Inventory" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff write Inventory" ON public."Inventory" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow authenticated read Transactions" ON public."InventoryTransaction" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff write Transactions" ON public."InventoryTransaction" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow authenticated read Maintenance" ON public."MaintenanceSchedule" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff write Maintenance" ON public."MaintenanceSchedule" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

-- F. Table: PartRequest, EquipmentCheckout, CheckoutItem
CREATE POLICY "Allow authenticated read PartRequests" ON public."PartRequest" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated create PartRequests" ON public."PartRequest" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow staff update PartRequests" ON public."PartRequest" FOR UPDATE TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow authenticated read Checkouts" ON public."EquipmentCheckout" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated create Checkouts" ON public."EquipmentCheckout" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow staff update Checkouts" ON public."EquipmentCheckout" FOR UPDATE TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow authenticated read CheckoutItems" ON public."CheckoutItem" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff write CheckoutItems" ON public."CheckoutItem" FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

-- G. Table: ChatSession, ChatMessage
CREATE POLICY "Allow authenticated read ChatSessions" ON public."ChatSession" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated create ChatSessions" ON public."ChatSession" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow participant update ChatSessions" ON public."ChatSession" FOR UPDATE TO authenticated 
    USING ("employeeId" = auth.uid()::text OR public.get_my_role() IN ('ADMIN', 'SUPER_ADMIN', 'ROOT', 'MANAGER', 'TECHNICIAN'));

CREATE POLICY "Allow authenticated read ChatMessages" ON public."ChatMessage" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow participant create ChatMessages" ON public."ChatMessage" FOR INSERT TO authenticated WITH CHECK (true);

-- H. Table: Notification
CREATE POLICY "Allow authenticated read own Notifications" ON public."Notification"
    FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);

CREATE POLICY "Allow system create Notifications" ON public."Notification"
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update own Notifications" ON public."Notification"
    FOR UPDATE TO authenticated USING ("userId" = auth.uid()::text);

CREATE POLICY "Allow authenticated delete own Notifications" ON public."Notification"
    FOR DELETE TO authenticated USING ("userId" = auth.uid()::text);

-- I. Default Policy for remaining tables (Read-Write for Staff, Read for all)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'Article', 'AssetComponentHistory', 'AssetMaintenanceLog', 'AssignedAsset', 
        'Attachment', 'AuditLog', 'Category', 'DirectoryCategory', 'DirectoryEntry', 
        'GoodsReceipt', 'Holiday', 'Location', 'MasterData', 'MenuPermission', 
        'Permission', 'PurchaseRequest', 'RelocationHistory', 'ReplacementRequest', 'RolePermission', 
        'StockAdjustmentRequest', 'StockOpname', 'StockOpnameItem', 'StockRequest', 'SystemSetting', 
        'SystemSettings', 'TeamMessage', 'WorkNote'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('
            CREATE POLICY "Allow authenticated read" ON public."%s" FOR SELECT TO authenticated USING (true);
            CREATE POLICY "Allow staff write" ON public."%s" FOR ALL TO authenticated 
                USING (public.get_my_role() IN (''ADMIN'', ''SUPER_ADMIN'', ''ROOT'', ''MANAGER'', ''TECHNICIAN''));
        ', t, t);
    END LOOP;
END;
$$;
