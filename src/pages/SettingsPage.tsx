import React from "react";
import { Settings, Monitor, Moon, Sun } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useSettings, FontSize } from "@/context/SettingsContext";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  
  // Funzioni di salvataggio per le varie sezioni
  const handleSaveGeneral = () => {
    toast.success(t("settings.toasts.generalSaved"));
  };
  
  const handleSaveNotifications = () => {
    toast.success(t("settings.toasts.notificationsSaved"));
  };
  
  const handleSaveAppearance = () => {
    toast.success(t("settings.toasts.appearanceSaved"));
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
            <p className="text-muted-foreground">{t("settings.description")}</p>
          </div>
        </div>
        
        <Tabs defaultValue="generale" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generale">{t("settings.tabs.general")}</TabsTrigger>
            <TabsTrigger value="notifiche">{t("settings.tabs.notifications")}</TabsTrigger>
            <TabsTrigger value="aspetto">{t("settings.tabs.appearance")}</TabsTrigger>
          </TabsList>
          
          {/* Tab Impostazioni Generali */}
          <TabsContent value="generale">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.general.title")}</CardTitle>
                <CardDescription>
                  {t("settings.general.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">{t("settings.general.language.title")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("settings.general.language.description")}
                    </p>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => updateSettings({ language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona lingua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it-IT">Italiano</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="fr-FR">Français</SelectItem>
                        <SelectItem value="de-DE">Deutsch</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium">{t("settings.general.behavior.title")}</h3>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="autoSave">{t("settings.general.autoSave.label")}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t("settings.general.autoSave.description")}
                          </p>
                        </div>
                        <Switch 
                          id="autoSave" 
                          checked={settings.autoSave}
                          onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="confirmations">{t("settings.general.confirmDialogs.label")}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t("settings.general.confirmDialogs.description")}
                          </p>
                        </div>
                        <Switch 
                          id="confirmations" 
                          checked={settings.confirmDialogs}
                          onCheckedChange={(checked) => updateSettings({ confirmDialogs: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveGeneral}>
                  {t("settings.general.saveButton")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tab Notifiche */}
          <TabsContent value="notifiche">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.notifications.title")}</CardTitle>
                <CardDescription>
                  {t("settings.notifications.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{t("settings.notifications.notificationsEnabled.title")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.notificationsEnabled.description")}
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => updateSettings({ notificationsEnabled: checked })}
                  />
                </div>
                
                <Separator />
                
                <div className={settings.notificationsEnabled ? "" : "opacity-50"}>
                  <h3 className="text-lg font-medium mb-4">{t("settings.notifications.channels.title")}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">{t("settings.notifications.emailNotifications.label")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.notifications.emailNotifications.description")}
                        </p>
                      </div>
                      <Switch 
                        id="emailNotifications" 
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
                        disabled={!settings.notificationsEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="pushNotifications">{t("settings.notifications.pushNotifications.label")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.notifications.pushNotifications.description")}
                        </p>
                      </div>
                      <Switch 
                        id="pushNotifications" 
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
                        disabled={!settings.notificationsEnabled}
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <h3 className="text-lg font-medium mb-4">{t("settings.notifications.categories.title")}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t("settings.notifications.contractNotifications.label")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.notifications.contractNotifications.description")}
                        </p>
                      </div>
                      <Switch 
                        checked={settings.contractNotifications}
                        onCheckedChange={(checked) => updateSettings({ contractNotifications: checked })}
                        disabled={!settings.notificationsEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t("settings.notifications.tenantNotifications.label")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.notifications.tenantNotifications.description")}
                        </p>
                      </div>
                      <Switch 
                        checked={settings.tenantNotifications}
                        onCheckedChange={(checked) => updateSettings({ tenantNotifications: checked })}
                        disabled={!settings.notificationsEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t("settings.notifications.systemNotifications.label")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.notifications.systemNotifications.description")}
                        </p>
                      </div>
                      <Switch 
                        checked={settings.systemNotifications}
                        onCheckedChange={(checked) => updateSettings({ systemNotifications: checked })}
                        disabled={!settings.notificationsEnabled}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveNotifications} 
                  disabled={!settings.notificationsEnabled}
                >
                  {t("settings.notifications.saveButton")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tab Aspetto */}
          <TabsContent value="aspetto">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.appearance.title")}</CardTitle>
                <CardDescription>
                  {t("settings.appearance.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("settings.appearance.theme.title")}</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center ${settings.theme === 'light' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => updateSettings({ theme: 'light' })}
                    >
                      <Sun className="h-8 w-8 mb-2" />
                      <span>{t("settings.appearance.theme.options.light")}</span>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center ${settings.theme === 'dark' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => updateSettings({ theme: 'dark' })}
                    >
                      <Moon className="h-8 w-8 mb-2" />
                      <span>{t("settings.appearance.theme.options.dark")}</span>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center ${settings.theme === 'system' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => updateSettings({ theme: 'system' })}
                    >
                      <Monitor className="h-8 w-8 mb-2" />
                      <span>{t("settings.appearance.theme.options.system")}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("settings.appearance.fontSize.title")}</h3>
                  
                  <RadioGroup 
                    value={settings.fontSize} 
                    onValueChange={(value) => {
                      updateSettings({ fontSize: value as FontSize });
                    }}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="fontSize1" />
                      <Label htmlFor="fontSize1">{t("settings.appearance.fontSize.options.small")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="fontSize2" />
                      <Label htmlFor="fontSize2">{t("settings.appearance.fontSize.options.medium")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="fontSize3" />
                      <Label htmlFor="fontSize3">{t("settings.appearance.fontSize.options.large")}</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("settings.appearance.animations.title")}</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="animations">{t("settings.appearance.animations.label")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.appearance.animations.description")}
                      </p>
                    </div>
                    <Switch 
                      id="animations" 
                      checked={settings.animationsEnabled}
                      onCheckedChange={(checked) => updateSettings({ animationsEnabled: checked })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveAppearance}>
                  {t("settings.appearance.saveButton")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 