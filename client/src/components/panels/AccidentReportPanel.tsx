import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import i18n from '@/lib/i18n';
import { AccidentReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const accidentReportSchema = z.object({
  // Accident basic info
  dateTime: z.string().min(1, "Date et heure requises"),
  location: z.string().min(1, "Lieu requis"),
  description: z.string().min(10, "Description trop courte"),
  
  // Conditions fields
  weatherConditions: z.string().min(1, "Conditions météorologiques requises"),
  roadConditions: z.string().min(1, "État de la route requis"),
  
  // Additional form fields from the template
  accidentType: z.string().min(1, "Type d'accident requis"),
  accidentLocationCode: z.string().min(1, "Code d'emplacement requis"),
  municipality: z.string().min(1, "Municipalité requise"),
  province: z.string().min(1, "Province requise"),
  postedSpeed: z.string().optional(),
  totalDamageEstimate: z.string().optional(),
  emergencyEquipment: z.boolean().default(false),
  servicePerformed: z.boolean().default(false),
  
  // Driver 1 info
  driver1: z.object({
    name: z.string().min(1, "Nom du conducteur requis"),
    address: z.string().min(1, "Adresse requise"),
    telephone: z.string().min(1, "Numéro de téléphone requis"),
    postalCode: z.string().min(1, "Code postal requis"),
    licenseNumber: z.string().min(1, "Numéro de permis requis"),
    dob: z.string().min(1, "Date de naissance requise"),
    sex: z.string().min(1, "Sexe requis"),
    properLicense: z.boolean().default(true),
    suspended: z.boolean().default(false)
  }),
  
  // Driver 2 info (optional)
  driver2: z.object({
    name: z.string(),
    address: z.string(),
    telephone: z.string(),
    postalCode: z.string(),
    licenseNumber: z.string(),
    dob: z.string(),
    sex: z.string(),
    properLicense: z.boolean().default(true),
    suspended: z.boolean().default(false)
  }).optional(),
  
  // Vehicle 1 info
  vehicle1: z.object({
    licensePlate: z.string().min(1, "Plaque d'immatriculation requise"),
    makeModel: z.string().min(1, "Marque et modèle requis"),
    year: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 1900 && Number(val) <= new Date().getFullYear() + 1, {
      message: "Année invalide"
    }),
    color: z.string().min(1, "Couleur requise"),
    bodyType: z.string().min(1, "Type de carrosserie requis"),
    insuranceCompany: z.string().min(1, "Compagnie d'assurance requise"),
    insurancePolicy: z.string().min(1, "Numéro de police d'assurance requis"),
    ownerName: z.string(),
    ownerSameAsDriver: z.boolean().default(true),
    damageLocation: z.array(z.string()).min(1, "Localisation des dommages requise"),
    indirectlyInvolved: z.boolean().default(false),
    airBrake: z.boolean().default(false)
  }),
  
  // Vehicle 2 info (optional)
  vehicle2: z.object({
    licensePlate: z.string(),
    makeModel: z.string(),
    year: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 1900 && Number(val) <= new Date().getFullYear() + 1), {
      message: "Année invalide"
    }),
    color: z.string(),
    bodyType: z.string(),
    insuranceCompany: z.string(),
    insurancePolicy: z.string(),
    ownerName: z.string(),
    ownerSameAsDriver: z.boolean().default(true),
    damageLocation: z.array(z.string()),
    indirectlyInvolved: z.boolean().default(false),
    airBrake: z.boolean().default(false)
  }).optional(),
  
  // Property damage
  propertyDamage: z.string().optional(),
  
  // Witnesses
  witnesses: z.string().optional(),
  
  // Vehicle towed info
  vehicle1TowedBy: z.string().optional(),
  vehicle2TowedBy: z.string().optional()
});

type AccidentReportFormData = z.infer<typeof accidentReportSchema>;

const AccidentReportPanel: React.FC = () => {
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<AccidentReportFormData>({
    resolver: zodResolver(accidentReportSchema),
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      location: '',
      description: '',
      weatherConditions: '',
      roadConditions: '',
      accidentType: '',
      accidentLocationCode: '',
      municipality: '',
      province: 'QC',
      postedSpeed: '',
      totalDamageEstimate: '',
      emergencyEquipment: false,
      servicePerformed: false,
      
      driver1: {
        name: '',
        address: '',
        telephone: '',
        postalCode: '',
        licenseNumber: '',
        dob: '',
        sex: '',
        properLicense: true,
        suspended: false
      },
      
      driver2: {
        name: '',
        address: '',
        telephone: '',
        postalCode: '',
        licenseNumber: '',
        dob: '',
        sex: '',
        properLicense: true,
        suspended: false
      },
      
      vehicle1: {
        licensePlate: '',
        makeModel: '',
        year: '',
        color: '',
        bodyType: '',
        insuranceCompany: '',
        insurancePolicy: '',
        ownerName: '',
        ownerSameAsDriver: true,
        damageLocation: [],
        indirectlyInvolved: false,
        airBrake: false
      },
      
      vehicle2: {
        licensePlate: '',
        makeModel: '',
        year: '',
        color: '',
        bodyType: '',
        insuranceCompany: '',
        insurancePolicy: '',
        ownerName: '',
        ownerSameAsDriver: true,
        damageLocation: [],
        indirectlyInvolved: false,
        airBrake: false
      },
      
      propertyDamage: '',
      witnesses: '',
      vehicle1TowedBy: '',
      vehicle2TowedBy: ''
    }
  });
  
  const submitMutation = useMutation({
    mutationFn: async (data: AccidentReportFormData) => {
      // Extrayons les données dont le backend a besoin selon le schéma
      // Nous nous concentrons uniquement sur les champs requis par le backend
      const formattedData = {
        dateTime: new Date(data.dateTime),
        location: data.location,
        description: data.description,
        weatherConditions: data.weatherConditions,
        roadConditions: data.roadConditions,
        
        // Format vehicle 1 data - nous conservons uniquement les champs correspondant au schéma
        vehicle1: {
          licensePlate: data.vehicle1.licensePlate,
          makeModel: data.vehicle1.makeModel,
          year: parseInt(data.vehicle1.year),
          color: data.vehicle1.color
        },
        
        // Format vehicle 2 data if it exists - là aussi, uniquement les champs du schéma
        vehicle2: data.vehicle2 && data.vehicle2.licensePlate ? {
          licensePlate: data.vehicle2.licensePlate,
          makeModel: data.vehicle2.makeModel,
          year: data.vehicle2.year ? parseInt(data.vehicle2.year) : undefined,
          color: data.vehicle2.color
        } : undefined
      };
      
      console.log("Submitting data:", formattedData);
      
      const response = await apiRequest('POST', '/api/accident-reports', formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: i18n.t('common.success'),
        description: i18n.t('accidentReport.success'),
      });
      reset();
    },
    onError: (error) => {
      toast({
        title: i18n.t('common.error'),
        description: i18n.t('accidentReport.error'),
        variant: "destructive"
      });
      console.error('Error submitting accident report:', error);
    }
  });
  
  const onSubmit = (data: AccidentReportFormData) => {
    submitMutation.mutate(data);
  };
  
  const handleReset = () => {
    reset();
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-[#1E1E1E]">
        <h2 className="text-2xl font-bold">{i18n.t('accidentReport.title')}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Incident Information */}
          <div className="bg-[#1E1E1E] p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{i18n.t('accidentReport.incidentInfo.title')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">{i18n.t('accidentReport.incidentInfo.dateTime')}</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("dateTime")}
                />
                {errors.dateTime && <p className="text-red-500 text-sm mt-1">{errors.dateTime.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('accidentReport.incidentInfo.location')}</label>
                <input 
                  type="text" 
                  placeholder="Entrez l'adresse complète" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("location")}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">Type de rapport</label>
                <select 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("accidentType")}
                >
                  <option value="">Sélectionnez</option>
                  <option value="original">Original</option>
                  <option value="amended">Modifié</option>
                  <option value="failedToRemain">A omis de rester</option>
                </select>
                {errors.accidentType && <p className="text-red-500 text-sm mt-1">{errors.accidentType.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">Municipalité</label>
                <input 
                  type="text" 
                  placeholder="Entrez la municipalité" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("municipality")}
                />
                {errors.municipality && <p className="text-red-500 text-sm mt-1">{errors.municipality.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">Province</label>
                <select 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("province")}
                >
                  <option value="AB">Alberta (AB)</option>
                  <option value="BC">Colombie-Britannique (BC)</option>
                  <option value="MB">Manitoba (MB)</option>
                  <option value="NB">Nouveau-Brunswick (NB)</option>
                  <option value="NL">Terre-Neuve-et-Labrador (NL)</option>
                  <option value="NT">Territoires du Nord-Ouest (NT)</option>
                  <option value="NS">Nouvelle-Écosse (NS)</option>
                  <option value="NU">Nunavut (NU)</option>
                  <option value="ON">Ontario (ON)</option>
                  <option value="PE">Île-du-Prince-Édouard (PE)</option>
                  <option value="QC" selected>Québec (QC)</option>
                  <option value="SK">Saskatchewan (SK)</option>
                  <option value="YT">Yukon (YT)</option>
                </select>
                {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">Code d'emplacement d'accident</label>
                <select 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("accidentLocationCode")}
                >
                  <option value="">Sélectionnez</option>
                  <option value="01">01 - Hors intersection</option>
                  <option value="02">02 - Lié à une intersection</option>
                  <option value="03">03 - À l'intersection</option>
                  <option value="04">04 - À/près d'une allée privée</option>
                  <option value="05">05 - Au passage à niveau</option>
                  <option value="06">06 - Passage souterrain ou tunnel</option>
                  <option value="07">07 - Passage supérieur ou pont</option>
                  <option value="08">08 - Sentier</option>
                  <option value="09">09 - Lac ou rivière gelé</option>
                  <option value="10">10 - Terrain de stationnement</option>
                  <option value="98">98 - Autre</option>
                </select>
                {errors.accidentLocationCode && <p className="text-red-500 text-sm mt-1">{errors.accidentLocationCode.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">Vitesse affichée (km/h)</label>
                <input 
                  type="number" 
                  placeholder="Vitesse maximale affichée" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("postedSpeed")}
                />
                {errors.postedSpeed && <p className="text-red-500 text-sm mt-1">{errors.postedSpeed.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">Estimation des dommages ($)</label>
                <input 
                  type="number" 
                  placeholder="Montant total estimé des dommages" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("totalDamageEstimate")}
                />
                {errors.totalDamageEstimate && <p className="text-red-500 text-sm mt-1">{errors.totalDamageEstimate.message}</p>}
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="emergencyEquipment"
                  className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("emergencyEquipment")}
                />
                <label htmlFor="emergencyEquipment">Équipement d'urgence présent</label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="servicePerformed"
                  className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("servicePerformed")}
                />
                <label htmlFor="servicePerformed">Service effectué</label>
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-1">{i18n.t('accidentReport.incidentInfo.description')}</label>
                <textarea 
                  rows={3} 
                  placeholder="Description détaillée de l'accident" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("description")}
                ></textarea>
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('accidentReport.incidentInfo.weatherConditions')}</label>
                <select 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("weatherConditions")}
                >
                  <option value="">{i18n.t('accidentReport.weatherOptions.select')}</option>
                  <option value="clear">{i18n.t('accidentReport.weatherOptions.clear')}</option>
                  <option value="cloudy">{i18n.t('accidentReport.weatherOptions.cloudy')}</option>
                  <option value="rain">{i18n.t('accidentReport.weatherOptions.rain')}</option>
                  <option value="snow">{i18n.t('accidentReport.weatherOptions.snow')}</option>
                  <option value="fog">{i18n.t('accidentReport.weatherOptions.fog')}</option>
                </select>
                {errors.weatherConditions && <p className="text-red-500 text-sm mt-1">{errors.weatherConditions.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('accidentReport.incidentInfo.roadConditions')}</label>
                <select 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("roadConditions")}
                >
                  <option value="">{i18n.t('accidentReport.roadOptions.select')}</option>
                  <option value="dry">{i18n.t('accidentReport.roadOptions.dry')}</option>
                  <option value="wet">{i18n.t('accidentReport.roadOptions.wet')}</option>
                  <option value="snow">{i18n.t('accidentReport.roadOptions.snow')}</option>
                  <option value="ice">{i18n.t('accidentReport.roadOptions.ice')}</option>
                  <option value="gravel">{i18n.t('accidentReport.roadOptions.gravel')}</option>
                </select>
                {errors.roadConditions && <p className="text-red-500 text-sm mt-1">{errors.roadConditions.message}</p>}
              </div>
            </div>
          </div>
          
          {/* Vehicle Information */}
          <div className="bg-[#1E1E1E] p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{i18n.t('accidentReport.vehicleInfo.title')}</h3>
            
            {/* Driver 1 Information */}
            <div className="mb-6 pb-6 border-b border-[#2D2D2D]">
              <h4 className="text-lg font-bold mb-3">Conducteur 1 (D1) - Responsable présumé</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Nom complet</label>
                  <input 
                    type="text" 
                    placeholder="Nom, Prénom" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.name")}
                  />
                  {errors.driver1?.name && <p className="text-red-500 text-sm mt-1">{errors.driver1.name.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Numéro de permis de conduire</label>
                  <input 
                    type="text" 
                    placeholder="Numéro du permis" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.licenseNumber")}
                  />
                  {errors.driver1?.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.driver1.licenseNumber.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Adresse</label>
                  <input 
                    type="text" 
                    placeholder="Adresse complète" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.address")}
                  />
                  {errors.driver1?.address && <p className="text-red-500 text-sm mt-1">{errors.driver1.address.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Code postal</label>
                  <input 
                    type="text" 
                    placeholder="Code postal" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.postalCode")}
                  />
                  {errors.driver1?.postalCode && <p className="text-red-500 text-sm mt-1">{errors.driver1.postalCode.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="Numéro de téléphone" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.telephone")}
                  />
                  {errors.driver1?.telephone && <p className="text-red-500 text-sm mt-1">{errors.driver1.telephone.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Date de naissance</label>
                  <input 
                    type="date" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.dob")}
                  />
                  {errors.driver1?.dob && <p className="text-red-500 text-sm mt-1">{errors.driver1.dob.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Sexe</label>
                  <select 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.sex")}
                  >
                    <option value="">Sélectionnez</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="X">X</option>
                  </select>
                  {errors.driver1?.sex && <p className="text-red-500 text-sm mt-1">{errors.driver1.sex.message}</p>}
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="driver1ProperLicense"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.properLicense")}
                  />
                  <label htmlFor="driver1ProperLicense">Permis approprié pour conduire la catégorie de véhicule</label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="driver1Suspended"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver1.suspended")}
                  />
                  <label htmlFor="driver1Suspended">Conducteur avec permis suspendu</label>
                </div>
              </div>
            </div>
            
            {/* Vehicle 1 */}
            <div className="mb-6 pb-6 border-b border-[#2D2D2D]">
              <h4 className="text-lg font-bold mb-3">Véhicule 1 (V1)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.licensePlate')}</label>
                  <input 
                    type="text" 
                    placeholder="Plaque d'immatriculation" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.licensePlate")}
                  />
                  {errors.vehicle1?.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.licensePlate.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.makeModel')}</label>
                  <input 
                    type="text" 
                    placeholder="Marque et modèle" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.makeModel")}
                  />
                  {errors.vehicle1?.makeModel && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.makeModel.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.year')}</label>
                  <input 
                    type="number" 
                    placeholder="Année" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.year")}
                  />
                  {errors.vehicle1?.year && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.year.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.color')}</label>
                  <input 
                    type="text" 
                    placeholder="Couleur" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.color")}
                  />
                  {errors.vehicle1?.color && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.color.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Type de carrosserie</label>
                  <select 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.bodyType")}
                  >
                    <option value="">Sélectionnez</option>
                    <option value="2D">2 portes (2D)</option>
                    <option value="3D">3 portes (3D)</option>
                    <option value="4D">4 portes (4D)</option>
                    <option value="5D">5 portes (5D)</option>
                    <option value="CV">Décapotable (CV/Conv)</option>
                    <option value="SW">Familiale (SW)</option>
                    <option value="MC">Moto (MC)</option>
                    <option value="Tra">Tracteur (Tra)</option>
                    <option value="Pnl">Fourgonnette (Pnl)</option>
                    <option value="Pk">Camionnette (Pk)</option>
                    <option value="Sk">Plateau (Sk/Stk)</option>
                    <option value="MH">Autocaravane (MH)</option>
                    <option value="Dp">Benne basculante (Dp)</option>
                    <option value="Vn">Fourgonnette (Vn)</option>
                    <option value="Bu">Autobus (Bu)</option>
                    <option value="SB">Autobus scolaire (SB)</option>
                  </select>
                  {errors.vehicle1?.bodyType && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.bodyType.message}</p>}
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="vehicle1OwnerSameAsDriver"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.ownerSameAsDriver")}
                  />
                  <label htmlFor="vehicle1OwnerSameAsDriver">Propriétaire = Conducteur</label>
                </div>
                
                <div className={`${watch('vehicle1.ownerSameAsDriver') ? 'hidden' : ''}`}>
                  <label className="block mb-1">Nom du propriétaire</label>
                  <input 
                    type="text" 
                    placeholder="Nom, Prénom" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.ownerName")}
                    disabled={watch('vehicle1.ownerSameAsDriver')}
                  />
                  {!watch('vehicle1.ownerSameAsDriver') && errors.vehicle1?.ownerName && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.ownerName.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Compagnie d'assurance</label>
                  <input 
                    type="text" 
                    placeholder="Nom de la compagnie" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.insuranceCompany")}
                  />
                  {errors.vehicle1?.insuranceCompany && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.insuranceCompany.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Numéro de police d'assurance</label>
                  <input 
                    type="text" 
                    placeholder="Numéro de police" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.insurancePolicy")}
                  />
                  {errors.vehicle1?.insurancePolicy && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.insurancePolicy.message}</p>}
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="vehicle1IndirectlyInvolved"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.indirectlyInvolved")}
                  />
                  <label htmlFor="vehicle1IndirectlyInvolved">Indirectement impliqué</label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="vehicle1AirBrake"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.airBrake")}
                  />
                  <label htmlFor="vehicle1AirBrake">Frein à air</label>
                </div>
                
                <div>
                  <label className="block mb-1">Véhicule transporté vers/par</label>
                  <input 
                    type="text" 
                    placeholder="Nom du service et destination" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1TowedBy")}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-1">Localisation des dommages</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="01" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>01 - Coin avant droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="02" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>02 - Avant droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="03" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>03 - Centre droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="04" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>04 - Arrière droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="05" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>05 - Coin arrière droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="06" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>06 - Centre arrière</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="07" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>07 - Coin arrière gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="08" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>08 - Arrière gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="09" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>09 - Centre gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="10" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>10 - Avant gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="11" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>11 - Coin avant gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="12" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>12 - Centre avant</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="13" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>13 - Avant complet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="14" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>14 - Côté droit complet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="15" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>15 - Arrière complet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="16" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>16 - Côté gauche complet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="17" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>17 - Dessus</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="18" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>18 - Dessous</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="19" className="w-4 h-4" {...register("vehicle1.damageLocation")} />
                      <span>19 - Aucun contact</span>
                    </label>
                  </div>
                  {errors.vehicle1?.damageLocation && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.damageLocation.message}</p>}
                </div>
              </div>
            </div>
            
            {/* Driver 2 Information */}
            <div className="mb-6 pb-6 border-b border-[#2D2D2D]">
              <h4 className="text-lg font-bold mb-3">Conducteur 2 (D2)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Nom complet</label>
                  <input 
                    type="text" 
                    placeholder="Nom, Prénom" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.name")}
                  />
                  {errors.driver2?.name && <p className="text-red-500 text-sm mt-1">{errors.driver2.name.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Numéro de permis de conduire</label>
                  <input 
                    type="text" 
                    placeholder="Numéro du permis" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.licenseNumber")}
                  />
                  {errors.driver2?.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.driver2.licenseNumber.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Adresse</label>
                  <input 
                    type="text" 
                    placeholder="Adresse complète" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.address")}
                  />
                  {errors.driver2?.address && <p className="text-red-500 text-sm mt-1">{errors.driver2.address.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Code postal</label>
                  <input 
                    type="text" 
                    placeholder="Code postal" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.postalCode")}
                  />
                  {errors.driver2?.postalCode && <p className="text-red-500 text-sm mt-1">{errors.driver2.postalCode.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="Numéro de téléphone" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.telephone")}
                  />
                  {errors.driver2?.telephone && <p className="text-red-500 text-sm mt-1">{errors.driver2.telephone.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Date de naissance</label>
                  <input 
                    type="date" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.dob")}
                  />
                  {errors.driver2?.dob && <p className="text-red-500 text-sm mt-1">{errors.driver2.dob.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Sexe</label>
                  <select 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.sex")}
                  >
                    <option value="">Sélectionnez</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="X">X</option>
                  </select>
                  {errors.driver2?.sex && <p className="text-red-500 text-sm mt-1">{errors.driver2.sex.message}</p>}
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="driver2ProperLicense"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.properLicense")}
                  />
                  <label htmlFor="driver2ProperLicense">Permis approprié pour conduire la catégorie de véhicule</label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="driver2Suspended"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("driver2.suspended")}
                  />
                  <label htmlFor="driver2Suspended">Conducteur avec permis suspendu</label>
                </div>
              </div>
            </div>
            
            {/* Vehicle 2 */}
            <div>
              <h4 className="text-lg font-bold mb-3">Véhicule 2 (V2)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.licensePlate')}</label>
                  <input 
                    type="text" 
                    placeholder="Plaque d'immatriculation" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.licensePlate")}
                  />
                  {errors.vehicle2?.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.licensePlate.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.makeModel')}</label>
                  <input 
                    type="text" 
                    placeholder="Marque et modèle" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.makeModel")}
                  />
                  {errors.vehicle2?.makeModel && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.makeModel.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.year')}</label>
                  <input 
                    type="number" 
                    placeholder="Année" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.year")}
                  />
                  {errors.vehicle2?.year && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.year.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.color')}</label>
                  <input 
                    type="text" 
                    placeholder="Couleur" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.color")}
                  />
                  {errors.vehicle2?.color && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.color.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Type de carrosserie</label>
                  <select 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.bodyType")}
                  >
                    <option value="">Sélectionnez</option>
                    <option value="2D">2 portes (2D)</option>
                    <option value="3D">3 portes (3D)</option>
                    <option value="4D">4 portes (4D)</option>
                    <option value="5D">5 portes (5D)</option>
                    <option value="CV">Décapotable (CV/Conv)</option>
                    <option value="SW">Familiale (SW)</option>
                    <option value="MC">Moto (MC)</option>
                    <option value="Tra">Tracteur (Tra)</option>
                    <option value="Pnl">Fourgonnette (Pnl)</option>
                    <option value="Pk">Camionnette (Pk)</option>
                    <option value="Sk">Plateau (Sk/Stk)</option>
                    <option value="MH">Autocaravane (MH)</option>
                    <option value="Dp">Benne basculante (Dp)</option>
                    <option value="Vn">Fourgonnette (Vn)</option>
                    <option value="Bu">Autobus (Bu)</option>
                    <option value="SB">Autobus scolaire (SB)</option>
                  </select>
                  {errors.vehicle2?.bodyType && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.bodyType.message}</p>}
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="vehicle2OwnerSameAsDriver"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.ownerSameAsDriver")}
                  />
                  <label htmlFor="vehicle2OwnerSameAsDriver">Propriétaire = Conducteur</label>
                </div>
                
                <div className={`${watch('vehicle2.ownerSameAsDriver') ? 'hidden' : ''}`}>
                  <label className="block mb-1">Nom du propriétaire</label>
                  <input 
                    type="text" 
                    placeholder="Nom, Prénom" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.ownerName")}
                    disabled={watch('vehicle2.ownerSameAsDriver')}
                  />
                  {!watch('vehicle2.ownerSameAsDriver') && errors.vehicle2?.ownerName && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.ownerName.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Compagnie d'assurance</label>
                  <input 
                    type="text" 
                    placeholder="Nom de la compagnie" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.insuranceCompany")}
                  />
                  {errors.vehicle2?.insuranceCompany && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.insuranceCompany.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">Numéro de police d'assurance</label>
                  <input 
                    type="text" 
                    placeholder="Numéro de police" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.insurancePolicy")}
                  />
                  {errors.vehicle2?.insurancePolicy && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.insurancePolicy.message}</p>}
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="vehicle2IndirectlyInvolved"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.indirectlyInvolved")}
                  />
                  <label htmlFor="vehicle2IndirectlyInvolved">Indirectement impliqué</label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="vehicle2AirBrake"
                    className="w-5 h-5 rounded bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.airBrake")}
                  />
                  <label htmlFor="vehicle2AirBrake">Frein à air</label>
                </div>
                
                <div>
                  <label className="block mb-1">Véhicule transporté vers/par</label>
                  <input 
                    type="text" 
                    placeholder="Nom du service et destination" 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2TowedBy")}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-1">Localisation des dommages</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="01" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>01 - Coin avant droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="02" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>02 - Avant droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="03" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>03 - Centre droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="04" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>04 - Arrière droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="05" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>05 - Coin arrière droit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="06" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>06 - Centre arrière</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="07" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>07 - Coin arrière gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="08" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>08 - Arrière gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="09" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>09 - Centre gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="10" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>10 - Avant gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="11" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>11 - Coin avant gauche</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="12" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>12 - Centre avant</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="13" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>13 - Avant complet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="14" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>14 - Côté droit complet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="15" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>15 - Arrière complet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="16" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>16 - Côté gauche complet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="17" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>17 - Dessus</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="18" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>18 - Dessous</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="19" className="w-4 h-4" {...register("vehicle2.damageLocation")} />
                      <span>19 - Aucun contact</span>
                    </label>
                  </div>
                  {errors.vehicle2?.damageLocation && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.damageLocation.message}</p>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="bg-[#1E1E1E] p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Informations supplémentaires</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1">Dommages à d'autres biens</label>
                <textarea 
                  rows={3} 
                  placeholder="Décrire les dommages à d'autres biens" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("propertyDamage")}
                ></textarea>
              </div>
              
              <div>
                <label className="block mb-1">Témoins indépendants</label>
                <textarea 
                  rows={3} 
                  placeholder="Noms et coordonnées des témoins" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("witnesses")}
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1E1E1E] p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Informations importantes</h3>
            
            <div className="space-y-2 text-[#f3f3f3]">
              <p>Pour les raisons ci-dessous, un rapport de collision de véhicule automobile <strong>n'a pas à être rempli</strong> si la collision :</p>
              <ul className="list-disc pl-6">
                <li>N'a pas entraîné de blessure/décès</li>
                <li>Les dommages totaux sont inférieurs à 1000 $</li>
                <li>Les dommages totaux sont inférieurs à 400 $ pour une motoneige</li>
              </ul>
              <p className="text-yellow-500 mt-4">Veuillez vous assurer que toutes les informations fournies sont exactes et complètes.</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              className="px-6 py-3 rounded-lg bg-[#2D2D2D] text-[#f89422] font-bold"
              onClick={handleReset}
            >
              {i18n.t('accidentReport.reset')}
            </Button>
            <Button
              type="submit"
              className="px-6 py-3 rounded-lg bg-[#f89422] text-[#121212] font-bold"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? i18n.t('common.loading') : i18n.t('accidentReport.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccidentReportPanel;
