import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client } from '../types';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedClients: Client[] = data.map(item => ({
        id: item.id,
        name: item.name,
        rfc: item.rfc,
        address: item.address,
        phone: item.phone,
        email: item.email,
        zone: item.zone,
        credit_limit: item.credit_limit,
        balance: item.balance
      }));

      setClients(formattedClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching clients');
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Omit<Client, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      const newClient: Client = {
        id: data.id,
        name: data.name,
        rfc: data.rfc,
        address: data.address,
        phone: data.phone,
        email: data.email,
        zone: data.zone,
        credit_limit: data.credit_limit,
        balance: data.balance
      };

      setClients(prev => [newClient, ...prev]);
      return newClient;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating client');
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedClient: Client = {
        id: data.id,
        name: data.name,
        rfc: data.rfc,
        address: data.address,
        phone: data.phone,
        email: data.email,
        zone: data.zone,
        credit_limit: data.credit_limit,
        balance: data.balance
      };

      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      return updatedClient;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating client');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting client');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
}