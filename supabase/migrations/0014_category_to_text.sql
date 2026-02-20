-- Migration to change category from enum to text for flexibility with OCR
-- This allows OCR to extract any category name from invoices

-- First, alter the costs table to use text instead of enum
alter table public.costs 
  alter column category type text using category::text;

-- Drop the old enum type (if no other tables use it)
drop type if exists public.cost_category cascade;

-- Add a comment explaining the change
comment on column public.costs.category is 'Cost category - accepts any text value for flexibility with OCR extraction';
