"use client"

import { useState } from "react"
import { useApi } from "@/hooks/useApi"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Trash2, UserPlus, Shield, User, Pencil, LogOut } from "lucide-react"
import { navItems } from "@/lib/nav"
import { useUser } from "@/contexts/UserContext"

interface Member {
    id: string
    email: string
    role: string
    allowed_pages?: string[] | null
    created_at: string
    last_sign_in: string | null
    is_owner: boolean
}

export function TeamManagement() {
    const { t } = useLanguage();
    const { role: currentUserRole } = useUser();
    const isOwner = currentUserRole === 'owner';
    const { data, loading, error, refetch } = useApi<{ members: Member[] }>("/api/team")
    const [modalOpen, setModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<Member | null>(null)

    // Form state
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("viewer")
    // Permissions: default to all pages for new users
    const [allowedPages, setAllowedPages] = useState<string[]>(navItems.map(i => i.path))

    const [submitting, setSubmitting] = useState(false)

    const handleOpenInvite = () => {
        setEditingMember(null);
        setEmail("");
        setPassword("");
        setRole("viewer");
        setAllowedPages(navItems.map(i => i.path)); // Default all checked
        setModalOpen(true);
    }

    const handleOpenEdit = (member: Member) => {
        setEditingMember(member);
        setEmail(member.email);
        setPassword(""); // Password not editable here
        setRole(member.role);
        // If allowed_pages is null -> all checked, else use value
        setAllowedPages(member.allowed_pages || navItems.map(i => i.path));
        setModalOpen(true);
    }

    const togglePage = (path: string) => {
        setAllowedPages(prev =>
            prev.includes(path)
                ? prev.filter(p => p !== path)
                : [...prev, path]
        );
    }

    const handleSave = async () => {
        if (!editingMember && (!email || !password)) return
        setSubmitting(true)
        try {
            const url = editingMember ? `/api/team/${editingMember.id}` : "/api/team";
            const method = editingMember ? "PATCH" : "POST";

            const payload: any = { role, allowed_pages: allowedPages };
            if (!editingMember) {
                payload.email = email;
                payload.password = password;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Operation failed")

            toast.success(editingMember ? "Member updated" : `Invited ${email}`)
            setModalOpen(false)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemove = async (id: string) => {
        if (!confirm("Are you sure? This will remove the user and delete their account.")) return
        try {
            const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const result = await res.json().catch(() => ({ error: "Failed to remove" }));
                throw new Error(result.error || "Failed to remove");
            }
            toast.success("User removed");
            refetch();
        } catch (err: any) {
            toast.error(err.message);
        }
    }

    const handleTerminateSession = async (id: string, email: string) => {
        if (!confirm(`Terminate all active sessions for ${email}? They will be logged out immediately.`)) return;
        try {
            const res = await fetch(`/api/team/${id}/signout`, { method: "POST" });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to terminate session");
            toast.success(`Session terminated for ${email}`);
        } catch (err: any) {
            toast.error(err.message);
        }
    }

    if (loading) return (
        <Card className="shadow-card rounded-2xl animate-pulse">
            <CardHeader><div className="h-6 w-32 bg-muted rounded"></div></CardHeader>
            <CardContent><div className="h-24 bg-muted/50 rounded"></div></CardContent>
        </Card>
    )

    if (error) return (
        <Card className="shadow-card rounded-2xl border-destructive/50">
            <CardHeader><CardTitle className="text-destructive">Error Loading Team</CardTitle></CardHeader>
            <CardContent>{error}</CardContent>
        </Card>
    )

    const members = data?.members || []

    return (
        <Card className="shadow-card rounded-2xl">
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>Manage user access and roles for this brand instance.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-2 rounded-xl" onClick={handleOpenInvite}>
                        <UserPlus className="h-4 w-4" />
                        Add Member
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map(member => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/20">
                                            {member.email?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{member.email}</div>
                                            {member.last_sign_in && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    Last seen: {new Date(member.last_sign_in).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        {member.role === 'owner' || member.role === 'admin' ?
                                            <Shield className="h-3.5 w-3.5 text-primary" /> :
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                        }
                                        <span className="capitalize text-sm font-medium">{member.role}</span>
                                    </div>
                                    {member.allowed_pages && member.allowed_pages.length < navItems.length && member.role !== 'owner' && (
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            {member.allowed_pages.length} pages allowed
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(member.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {!member.is_owner ? (
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                                                onClick={() => handleOpenEdit(member)}
                                                title="Edit permissions"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {isOwner && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg"
                                                    onClick={() => handleTerminateSession(member.id, member.email)}
                                                    title="Terminate active session"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-lg"
                                                onClick={() => handleRemove(member.id)}
                                                title="Remove user"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic px-2">Owner</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {members.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    No team members added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingMember ? "Edit Member" : "Add New Member"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                disabled={!!editingMember}
                            />
                        </div>
                        {!editingMember && (
                            <div className="grid gap-2">
                                <Label>Password</Label>
                                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set initial password" />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                    <SelectItem value="editor">Editor (Can edit data)</SelectItem>
                                    <SelectItem value="viewer">Viewer (Read only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Page Permissions */}
                        <div className="space-y-3 pt-2">
                            <Label>Page Access</Label>
                            <div className="grid grid-cols-1 gap-2 border rounded-xl p-3 bg-muted/30">
                                <div className="flex items-center space-x-2 pb-2 mb-2 border-b">
                                    <Checkbox
                                        id="all"
                                        checked={allowedPages.length === navItems.length}
                                        onCheckedChange={(checked) => {
                                            if (checked) setAllowedPages(navItems.map(i => i.path));
                                            else setAllowedPages([]);
                                        }}
                                    />
                                    <label htmlFor="all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Select All
                                    </label>
                                </div>
                                {navItems.map((item) => (
                                    <div key={item.path} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={item.path}
                                            checked={allowedPages.includes(item.path)}
                                            onCheckedChange={() => togglePage(item.path)}
                                        />
                                        <label htmlFor={item.path} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {t(item.key)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Unchecked pages will be hidden from the user's sidebar.
                            </p>
                        </div>

                        <Button onClick={handleSave} disabled={submitting} className="w-full mt-4 rounded-xl">
                            {submitting ? "Saving..." : editingMember ? "Update Member" : "Create & Add User"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
