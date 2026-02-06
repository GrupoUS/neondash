/**
 * Contacts List Panel
 * Manage WhatsApp contacts with search, edit, and CRM linking
 */

import { Link2, Loader2, Pencil, Phone, Search, User, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface ContactsListPanelProps {
  className?: string;
  onSelectContact?: (phone: string) => void;
}

export function ContactsListPanel({ className, onSelectContact }: ContactsListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{
    phone: string;
    name: string | null;
    notes: string | null;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");

  // Fetch contacts
  const {
    data: contactsData,
    isLoading,
    refetch: refetchContacts,
  } = trpc.metaApi.getContacts.useQuery({ search: searchQuery, limit: 100 });

  // Fetch leads for linking
  const { data: leadsData } = trpc.leads.list.useQuery({});

  // Mutations
  const upsertMutation = trpc.metaApi.upsertContact.useMutation({
    onSuccess: () => {
      setEditDialogOpen(false);
      refetchContacts();
    },
  });

  const linkMutation = trpc.metaApi.linkContactToLead.useMutation({
    onSuccess: () => {
      setLinkDialogOpen(false);
      refetchContacts();
    },
  });

  const openEditDialog = (contact: {
    phone: string;
    name: string | null;
    notes: string | null;
  }) => {
    setSelectedContact(contact);
    setEditName(contact.name ?? "");
    setEditNotes(contact.notes ?? "");
    setEditDialogOpen(true);
  };

  const openLinkDialog = (contact: {
    phone: string;
    name: string | null;
    notes: string | null;
  }) => {
    setSelectedContact(contact);
    setSelectedLeadId("");
    setLinkDialogOpen(true);
  };

  const handleSaveContact = () => {
    if (!selectedContact) return;
    upsertMutation.mutate({
      phone: selectedContact.phone,
      name: editName.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });
  };

  const handleLinkToLead = () => {
    if (!selectedContact || !selectedLeadId) return;
    linkMutation.mutate({
      phone: selectedContact.phone,
      leadId: parseInt(selectedLeadId, 10),
    });
  };

  const contacts = contactsData?.contacts ?? [];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Contatos</h3>
          <Badge variant="secondary" className="ml-auto">
            {contactsData?.total ?? 0}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length > 0 ? (
          <div className="divide-y divide-border/50">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-3 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>

                  {/* Info */}
                  <button
                    type="button"
                    className="flex-1 min-w-0 cursor-pointer text-left"
                    onClick={() => onSelectContact?.(contact.phone)}
                  >
                    <p className="font-medium text-sm truncate">{contact.name || contact.phone}</p>
                    {contact.name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </p>
                    )}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(contact)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openLinkDialog(contact)}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                {contact.notes && (
                  <p className="text-xs text-muted-foreground mt-2 pl-13 truncate">
                    {contact.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <UserPlus className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Nenhum contato encontrado" : "Nenhum contato salvo"}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
            <DialogDescription>
              Altere o nome ou adicione observações para este contato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={selectedContact?.phone ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome do contato"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre o contato..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveContact} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link to CRM Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular ao CRM</DialogTitle>
            <DialogDescription>Associe este contato a um lead existente no CRM.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Contato</Label>
              <Input value={selectedContact?.name ?? selectedContact?.phone ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Lead do CRM</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leadsData?.leads?.map((lead) => (
                    <SelectItem key={lead.id} value={String(lead.id)}>
                      {lead.nome} {lead.telefone && `- ${lead.telefone}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkToLead} disabled={!selectedLeadId || linkMutation.isPending}>
              {linkMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContactsListPanel;
