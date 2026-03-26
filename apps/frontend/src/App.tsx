import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getUser, listUsers, toggleActive } from "./api/client";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Select } from "./components/ui/select";
import { Skeleton } from "./components/ui/skeleton";
import type { Role, User } from "./types/user";

type SortDirection = "none" | "asc" | "desc";

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }
    >
      {active ? "active" : "inactive"}
    </Badge>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge
      className={
        role === "admin"
          ? "border-cyan-200 bg-cyan-50 text-cyan-700"
          : role === "editor"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-yellow-200 bg-yellow-50 text-yellow-700"
      }
    >
      {role}
    </Badge>
  );
}

export default function App() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [sort, setSort] = useState<SortDirection>("none");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users", { search, role }],
    queryFn: ({ signal }) =>
      listUsers({
        search: search.trim() ? search.trim() : undefined,
        role,
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  const sortedUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    if (sort === "none") return users;

    const copy = [...users];
    copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "desc") copy.reverse();
    return copy;
  }, [usersQuery.data, sort]);

  const selectedUserQuery = useQuery({
    queryKey: ["user", selectedUserId],
    queryFn: ({ signal }) => {
      if (!selectedUserId) throw new Error("No user selected");
      return getUser({ id: selectedUserId, signal });
    },
    enabled: Boolean(selectedUserId),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => toggleActive({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["user", id] });

      const previousUsersEntries = queryClient
        .getQueriesData<User[]>({ queryKey: ["users"] })
        .map(([key, data]) => ({ key, data }));
      const previousUser = queryClient.getQueryData<User>(["user", id]);

      for (const entry of previousUsersEntries) {
        if (!entry.data) continue;
        queryClient.setQueryData<User[]>(entry.key, (current) => {
          if (!current) return current;
          return current.map((u) =>
            u.id === id ? { ...u, active: !u.active } : u,
          );
        });
      }

      if (previousUser) {
        queryClient.setQueryData<User>(["user", id], {
          ...previousUser,
          active: !previousUser.active,
        });
      }

      return { previousUsersEntries, previousUser };
    },
    onError: (_err, id, ctx) => {
      if (!ctx) return;
      for (const entry of ctx.previousUsersEntries) {
        queryClient.setQueryData(entry.key, entry.data);
      }
      if (ctx.previousUser) {
        queryClient.setQueryData(["user", id], ctx.previousUser);
      }
    },
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });

  const [viewSeconds, setViewSeconds] = useState(0);

  useEffect(() => {
    if (!selectedUserId) return;
    if (!selectedUserQuery.data) return;

    const interval = window.setInterval(() => {
      setViewSeconds((s) => s + 1);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [selectedUserId, selectedUserQuery.data]);

  const sortDisabled = usersQuery.isFetching;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                value={search}
                placeholder="Search users..."
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setRole(e.target.value as Role | "all")
                }
              >
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={sortDisabled}
            onClick={() => {
              setSort((s) =>
                s === "none" ? "asc" : s === "asc" ? "desc" : "none",
              );
            }}
          >
            Sort by name
            {sort === "asc" ? " (A-Z)" : sort === "desc" ? " (Z-A)" : ""}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold">Users</div>
              <div className="text-xs text-slate-500">
                {usersQuery.isFetching
                  ? "Loading…"
                  : `${sortedUsers.length} users`}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {usersQuery.isLoading ? (
                <div className="p-4">
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : usersQuery.isError ? (
                <div className="p-4 text-sm text-red-600">
                  Failed to load users.
                </div>
              ) : (
                sortedUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setViewSeconds(0);
                    }}
                    className={
                      "flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 " +
                      (selectedUserId === u.id ? "bg-slate-50" : "")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{u.name}</div>
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} />
                        <ActiveBadge active={u.active} />
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold">User Details</div>
              <div className="text-xs text-slate-500">
                {selectedUserId ? `ID: ${selectedUserId}` : "Select a user"}
              </div>
            </div>

            <div className="p-4">
              {!selectedUserId ? (
                <div className="text-sm text-slate-600">
                  Pick a user from the list.
                </div>
              ) : selectedUserQuery.isLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-40" />
                </div>
              ) : selectedUserQuery.isError ? (
                <div className="text-sm text-red-600">Failed to load user.</div>
              ) : selectedUserQuery.data ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-lg font-semibold">
                      {selectedUserQuery.data.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      Email: {selectedUserQuery.data.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">Role:</span>
                      <RoleBadge role={selectedUserQuery.data.role} />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">Status:</span>
                      <ActiveBadge active={selectedUserQuery.data.active} />
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="font-medium">Bonus</div>
                    <div className="text-slate-600">
                      Viewing profile for {viewSeconds} seconds
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(selectedUserId)}
                    >
                      Toggle Active
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedUserId(null);
                        setViewSeconds(0);
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  {toggleMutation.isError ? (
                    <div className="text-sm text-red-600">
                      Failed to toggle status.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          API: {import.meta.env.VITE_API_URLS ?? "http://localhost:3030"}
        </div>
      </div>
    </div>
  );
}
