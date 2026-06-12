import { useState } from "react";
import { 
  useListPterodactylUsers, 
  getListPterodactylUsersQueryKey, 
  useGetSettings, 
  getGetSettingsQueryKey,
  useCreatePterodactylUser,
  useUpdatePterodactylUser,
  useDeletePterodactylUser
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, User as UserIcon, AlertCircle, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";

export default function Users() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: usersData, isLoading, refetch } = useListPterodactylUsers(
    { page, search: search || undefined },
    { query: { queryKey: getListPterodactylUsersQueryKey({ page, search: search || undefined }), enabled: settings?.configured } }
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    rootAdmin: false
  });

  const createUser = useCreatePterodactylUser();
  const updateUser = useUpdatePterodactylUser();
  const deleteUser = useDeletePterodactylUser();

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      rootAdmin: false
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "User created successfully" });
        setIsCreateOpen(false);
        resetForm();
        refetch();
      },
      onError: (err) => toast({ title: "Failed to create user", description: err.error, variant: "destructive" })
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const dataToUpdate: any = { ...formData };
    if (!dataToUpdate.password) {
      delete dataToUpdate.password;
    }
    
    updateUser.mutate({ userId: selectedUser.id, data: dataToUpdate }, {
      onSuccess: () => {
        toast({ title: "User updated successfully" });
        setIsEditOpen(false);
        refetch();
      },
      onError: (err) => toast({ title: "Failed to update user", description: err.error, variant: "destructive" })
    });
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    
    deleteUser.mutate({ userId: selectedUser.id }, {
      onSuccess: () => {
        toast({ title: "User deleted successfully" });
        setIsDeleteOpen(false);
        refetch();
      },
      onError: (err) => toast({ title: "Failed to delete user", description: err.error, variant: "destructive" })
    });
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "", // empty for edit unless they want to change it
      rootAdmin: user.rootAdmin
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-foreground mb-1">Users</h1>
          <p className="text-muted-foreground text-sm">Manage Pterodactyl panel users.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-9 bg-card border-border font-mono text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            className="font-mono bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-2" /> New User
          </Button>
        </div>
      </div>

      {settings && !settings.configured && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-destructive">Pterodactyl Not Configured</h3>
            <p className="text-sm text-destructive/80 mt-1">Please configure your panel URL and API key in settings to view users.</p>
          </div>
        </div>
      )}

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-mono text-xs text-muted-foreground">USER</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">ROLE</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">2FA</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">CREATED</TableHead>
              <TableHead className="text-right font-mono text-xs text-muted-foreground">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-10 w-48 bg-accent/50" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 bg-accent/50" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 bg-accent/50" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32 bg-accent/50" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto bg-accent/50" /></TableCell>
                </TableRow>
              ))
            ) : usersData?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-mono">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              usersData?.data.map((user) => (
                <TableRow key={user.uuid} className="border-border hover:bg-accent/30 group">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground border border-border">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.email} • {user.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.rootAdmin ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
                        <ShieldCheck className="w-3 h-3 mr-1" /> ADMIN
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-mono text-xs">
                        <UserIcon className="w-3 h-3 mr-1" /> USER
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.twoFactor ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">ENABLED</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-mono text-xs">DISABLED</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground hover:text-foreground" onClick={() => openEditModal(user)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="font-mono text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteModal(user)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {usersData?.meta && usersData.meta.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm text-muted-foreground font-mono">Page {page} of {usersData.meta.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(usersData.meta.totalPages, p + 1))} disabled={page === usersData.meta.totalPages}>Next</Button>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border font-mono">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new user to your Pterodactyl panel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                  <Input id="firstName" required className="bg-background border-border" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                  <Input id="lastName" required className="bg-background border-border" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs text-muted-foreground">Username</Label>
                <Input id="username" required className="bg-background border-border" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email Address</Label>
                <Input id="email" type="email" required className="bg-background border-border" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <Input id="password" type="password" required className="bg-background border-border" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-foreground">Root Administrator</Label>
                  <p className="text-xs text-muted-foreground">Grant full panel access</p>
                </div>
                <Switch checked={formData.rootAdmin} onCheckedChange={checked => setFormData({...formData, rootAdmin: checked})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createUser.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {createUser.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border font-mono">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update {selectedUser?.username}'s details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName" className="text-xs text-muted-foreground">First Name</Label>
                  <Input id="edit-firstName" required className="bg-background border-border" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName" className="text-xs text-muted-foreground">Last Name</Label>
                  <Input id="edit-lastName" required className="bg-background border-border" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username" className="text-xs text-muted-foreground">Username</Label>
                <Input id="edit-username" required className="bg-background border-border" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-xs text-muted-foreground">Email Address</Label>
                <Input id="edit-email" type="email" required className="bg-background border-border" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-xs text-muted-foreground">Password (leave blank to keep)</Label>
                <Input id="edit-password" type="password" className="bg-background border-border" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-foreground">Root Administrator</Label>
                  <p className="text-xs text-muted-foreground">Grant full panel access</p>
                </div>
                <Switch checked={formData.rootAdmin} onCheckedChange={checked => setFormData({...formData, rootAdmin: checked})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateUser.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {updateUser.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-destructive/30 font-mono">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> Delete User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{selectedUser?.username}</strong>? This action cannot be undone and will remove their access to the panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={deleteUser.isPending} onClick={handleDelete}>
              {deleteUser.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
