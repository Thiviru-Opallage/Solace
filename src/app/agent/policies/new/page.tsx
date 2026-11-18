"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { getCustomers } from "@/lib/api/users";
import { createPolicy } from "@/lib/api/policies";
import { PolicyType, PolicyDetails, User } from "@/types";
import {
  ChevronLeft,
  Car,
  Home,
  Heart,
  Plane,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CreatePolicyPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<User[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const list = await getCustomers();
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomerId(list[0]._id);
        }
      } catch (err) {
        console.error("Failed to load customers:", err);
      }
    }
    loadCustomers();
  }, []);
  const [policyType, setPolicyType] = useState<PolicyType>("motor");
  const [coverageAmount, setCoverageAmount] = useState<number>(150000);
  const [deductible, setDeductible] = useState<number>(1500);
  const [premiumAmount, setPremiumAmount] = useState<number>(3200);
  const [premiumFrequency, setPremiumFrequency] = useState<
    "monthly" | "quarterly" | "annual"
  >("monthly");
  const [renewalDate, setRenewalDate] = useState("2026-12-31");

  // Motor fields
  const [motorMake, setMotorMake] = useState("Toyota");
  const [motorModel, setMotorModel] = useState("Corolla Cross");
  const [motorRegNo, setMotorRegNo] = useState("WP CBF-9021");
  const [motorYear, setMotorYear] = useState<number>(2023);

  // Health fields
  const [healthNetwork, setHealthNetwork] = useState<
    "Standard" | "Comprehensive" | "Global"
  >("Comprehensive");
  const [healthRoomType, setHealthRoomType] = useState<
    "Private" | "Semi-Private" | "Deluxe"
  >("Private");
  const [dependentsInput, setDependentsInput] = useState("Anjali, Rohan");

  // Home fields
  const [homeAddress, setHomeAddress] = useState(
    "15 Rosmead Place, Colombo 07"
  );
  const [homeValue, setHomeValue] = useState<number>(55000000);
  const [homeYear, setHomeYear] = useState<number>(2020);

  // Travel fields
  const [travelDestination, setTravelDestination] = useState(
    "Singapore & Thailand"
  );
  const [travelDeparture, setTravelDeparture] = useState("2026-08-01");
  const [travelReturn, setTravelReturn] = useState("2026-08-15");
  const [travelCount, setTravelCount] = useState<number>(2);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      let details: PolicyDetails;

      if (policyType === "motor") {
        details = {
          type: "motor",
          motor: {
            make: motorMake,
            model: motorModel,
            registrationNumber: motorRegNo,
            manufactureYear: motorYear,
          },
        };
      } else if (policyType === "health") {
        const deps = dependentsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        details = {
          type: "health",
          health: {
            network: healthNetwork,
            roomType: healthRoomType,
            dependents: deps,
          },
        };
      } else if (policyType === "home") {
        details = {
          type: "home",
          home: {
            propertyAddress: homeAddress,
            propertyValue: homeValue,
            constructionYear: homeYear,
          },
        };
      } else {
        details = {
          type: "travel",
          travel: {
            destination: travelDestination,
            departureDate: new Date(travelDeparture).toISOString(),
            returnDate: new Date(travelReturn).toISOString(),
            travellersCount: travelCount,
          },
        };
      }

      const created = await createPolicy({
        type: policyType,
        customerId: selectedCustomerId,
        agentId: user._id,
        coverage: {
          amount: coverageAmount,
          deductible,
        },
        premium: {
          amount: premiumAmount,
          frequency: premiumFrequency,
        },
        renewalDate: new Date(renewalDate).toISOString(),
        details,
      });

      toast.success(`Policy ${created.policyNumber} issued successfully`, {
        description: `Registered under ${policyType.toUpperCase()} insurance line.`,
      });

      router.push("/agent/policies");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create policy";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell allowedRoles={["agent"]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/agent/policies"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Issue New Insurance Policy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic policy creation form adapted to specific underwriting parameters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Policy Line Selection */}
          <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              1. Select Insurance Line
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { type: "motor" as PolicyType, label: "Motor", icon: Car },
                { type: "health" as PolicyType, label: "Health", icon: Heart },
                { type: "home" as PolicyType, label: "Home", icon: Home },
                { type: "travel" as PolicyType, label: "Travel", icon: Plane },
              ].map((item) => {
                const isSelected = policyType === item.type;
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setPolicyType(item.type)}
                    className={cn(
                      "p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all",
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/20"
                        : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Policyholder & Underwriting Terms */}
          <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              2. Client & Financial Terms
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policyholder (Customer)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Renewal Date
                </label>
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  required
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coverage Limit (LKR)
                </label>
                <input
                  type="number"
                  min={1000}
                  value={coverageAmount}
                  onChange={(e) => setCoverageAmount(Number(e.target.value))}
                  required
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deductible (LKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={deductible}
                  onChange={(e) => setDeductible(Number(e.target.value))}
                  required
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premium (LKR)
                </label>
                <input
                  type="number"
                  min={100}
                  value={premiumAmount}
                  onChange={(e) => setPremiumAmount(Number(e.target.value))}
                  required
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Frequency
                </label>
                <select
                  value={premiumFrequency}
                  onChange={(e) =>
                    setPremiumFrequency(
                      e.target.value as "monthly" | "quarterly" | "annual"
                    )
                  }
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. DYNAMIC FIELDS BY POLICY TYPE */}
          <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 capitalize">
              3. {policyType} Underwriting Specifications
            </h2>

            {/* MOTOR FIELDS */}
            {policyType === "motor" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Make
                  </label>
                  <input
                    type="text"
                    value={motorMake}
                    onChange={(e) => setMotorMake(e.target.value)}
                    required
                    placeholder="e.g. Toyota"
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    value={motorModel}
                    onChange={(e) => setMotorModel(e.target.value)}
                    required
                    placeholder="e.g. Corolla Cross"
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={motorRegNo}
                    onChange={(e) => setMotorRegNo(e.target.value)}
                    required
                    placeholder="e.g. WP CBF-9021"
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manufacture Year
                  </label>
                  <input
                    type="number"
                    min={1990}
                    max={2026}
                    value={motorYear}
                    onChange={(e) => setMotorYear(Number(e.target.value))}
                    required
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                  />
                </div>
              </div>
            )}

            {/* HEALTH FIELDS */}
            {policyType === "health" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Network
                  </label>
                  <select
                    value={healthNetwork}
                    onChange={(e) =>
                      setHealthNetwork(
                        e.target.value as "Standard" | "Comprehensive" | "Global"
                      )
                    }
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  >
                    <option value="Standard">Standard Network</option>
                    <option value="Comprehensive">Comprehensive Network</option>
                    <option value="Global">Global Network</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room Category
                  </label>
                  <select
                    value={healthRoomType}
                    onChange={(e) =>
                      setHealthRoomType(
                        e.target.value as "Private" | "Semi-Private" | "Deluxe"
                      )
                    }
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  >
                    <option value="Semi-Private">Semi-Private Room</option>
                    <option value="Private">Private Room</option>
                    <option value="Deluxe">Deluxe Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dependents (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={dependentsInput}
                    onChange={(e) => setDependentsInput(e.target.value)}
                    placeholder="e.g. Maya Sharma, Aarav"
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* HOME FIELDS */}
            {policyType === "home" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Address
                  </label>
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    required
                    placeholder="e.g. 15 Rosmead Place, Colombo 07"
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Construction Year
                  </label>
                  <input
                    type="number"
                    min={1950}
                    max={2026}
                    value={homeYear}
                    onChange={(e) => setHomeYear(Number(e.target.value))}
                    required
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Market Value (LKR)
                  </label>
                  <input
                    type="number"
                    min={1000000}
                    value={homeValue}
                    onChange={(e) => setHomeValue(Number(e.target.value))}
                    required
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                  />
                </div>
              </div>
            )}

            {/* TRAVEL FIELDS */}
            {policyType === "travel" && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Countries
                  </label>
                  <input
                    type="text"
                    value={travelDestination}
                    onChange={(e) => setTravelDestination(e.target.value)}
                    required
                    placeholder="e.g. Singapore & Thailand"
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={travelDeparture}
                    onChange={(e) => setTravelDeparture(e.target.value)}
                    required
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={travelReturn}
                    onChange={(e) => setTravelReturn(e.target.value)}
                    required
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of Travellers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={travelCount}
                    onChange={(e) => setTravelCount(Number(e.target.value))}
                    required
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/agent/policies"
              className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Issue Policy
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
