// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { z } from "zod";

const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  lastActivityAt: z.string().datetime(),
});

type Customer = z.infer<typeof customerSchema>;

// Type the fetcher to match the expected data shape
const fetcher = (url: string): Promise<{ customers: Customer[] }> => 
  fetch(url).then((res) => res.json() as Promise<{ customers: Customer[] }>);

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const { data, error, isLoading } = useSWR<{ customers: Customer[] }>(
    "/api/v1/boards/customers?search=" + search,
    fetcher
  );

  const filteredCustomers = data?.customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (error) return <div className="text-red-600 text-center p-4">Failed to load customers</div>;
  if (isLoading) return (
    <div className="p-4 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-md animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Customer Board</h1>
      <input
        type="text"
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors placeholder-gray-400"
        aria-label="Search customers"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            style={{ backgroundColor: 'var(--card)', color: 'var(--card-text)' }}
          >
            <p className="font-medium"><strong>Name:</strong> {customer.name}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Last Activity:</strong> {new Date(customer.lastActivityAt).toLocaleDateString()}</p>
          </div>
        ))}
        {filteredCustomers.length === 0 && !isLoading && <p className="text-center" style={{ color: 'var(--secondary-text)' }}>No customers found</p>}
      </div>
    </div>
  );
}