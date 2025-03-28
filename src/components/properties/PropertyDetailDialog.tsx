import { useState } from "react";
import { Property } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, HomeIcon, Hash, DollarSign, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PropertyDetailDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDetailDialog({ 
  property, 
  open, 
  onOpenChange 
}: PropertyDetailDialogProps) {
  // Helper per formattare la data
  const formatDate = (dateString?: string) => {
    if (!dateString) return "recentemente";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "recentemente";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {property.name}
          </DialogTitle>
          <DialogDescription>
            Dettagli e informazioni della proprietà
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Property Image */}
          <div className="relative h-56 w-full mb-4 rounded-md overflow-hidden bg-muted">
            {property.image_url ? (
              <img
                src={property.image_url}
                alt={property.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <Building2 className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}
            <Badge className="absolute top-2 right-2">
              {property.type}
            </Badge>
          </div>
          
          {/* Property Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{property.address}, {property.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <HomeIcon className="h-4 w-4 text-muted-foreground" />
                <span>{property.units} Unità</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>ID: {property.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Aggiunta {formatDate(property.created_at)}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">Valutazione</h4>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold">€{(property.current_value || 0).toLocaleString()}</span>
              </div>
            </div>
            
            {property.unit_names && property.units > 1 && (
              <div className="pt-2 border-t">
                <h4 className="font-medium mb-2">Unità</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Array.isArray(property.unit_names) ? (
                    property.unit_names.map((name, index) => (
                      <Badge key={index} variant="outline" className="px-2 py-1">
                        {name || `Unità ${index + 1}`}
                      </Badge>
                    ))
                  ) : (
                    [...Array(property.units)].map((_, index) => (
                      <Badge key={index} variant="outline" className="px-2 py-1">
                        Unità {index + 1}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">Descrizione</h4>
              <p className="text-muted-foreground">
                {property.description || "Nessuna descrizione disponibile per questa proprietà."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 