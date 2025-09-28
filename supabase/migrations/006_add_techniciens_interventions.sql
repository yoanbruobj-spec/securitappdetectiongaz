-- Table de liaison pour plusieurs techniciens par intervention
CREATE TABLE IF NOT EXISTS public.techniciens_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE NOT NULL,
    technicien_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role_technicien TEXT DEFAULT 'principal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(intervention_id, technicien_id)
);

CREATE INDEX idx_techniciens_interventions_intervention ON public.techniciens_interventions(intervention_id);
CREATE INDEX idx_techniciens_interventions_technicien ON public.techniciens_interventions(technicien_id);

ALTER TABLE public.techniciens_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Techniciens peuvent voir leurs affectations"
    ON public.techniciens_interventions FOR SELECT
    USING (
        auth.uid() = technicien_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins peuvent gérer les affectations"
    ON public.techniciens_interventions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );