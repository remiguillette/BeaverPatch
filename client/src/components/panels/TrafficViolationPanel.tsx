import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import i18n from '@/lib/i18n';
import { ViolationReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const violationReportSchema = z.object({
  dateTime: z.string().min(1, "Date et heure requises"),
  location: z.string().min(1, "Lieu requis"),
  violationType: z.string().min(1, "Type d'infraction requis"),
  severity: z.string().min(1, "Gravité requise"),
  description: z.string().min(10, "Description trop courte"),
  licensePlate: z.string().min(1, "Plaque d'immatriculation requise"),
  makeModel: z.string().min(1, "Marque et modèle requis"),
  driverName: z.string().min(1, "Nom du conducteur requis"),
  licenseNumber: z.string().min(1, "Numéro de permis requis"),
  notes: z.string().optional()
});

type ViolationReportFormData = z.infer<typeof violationReportSchema>;

const TrafficViolationPanel: React.FC = () => {
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ViolationReportFormData>({
    resolver: zodResolver(violationReportSchema),
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      location: '',
      violationType: '',
      severity: '',
      description: '',
      licensePlate: '',
      makeModel: '',
      driverName: '',
      licenseNumber: '',
      notes: ''
    }
  });
  
  const submitMutation = useMutation({
    mutationFn: async (data: ViolationReportFormData) => {
      // Convert form data to the expected API format
      const formattedData = {
        ...data,
        dateTime: new Date(data.dateTime),
      };
      
      const response = await apiRequest('POST', '/api/violation-reports', formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: i18n.t('common.success'),
        description: i18n.t('trafficViolation.success'),
      });
      reset();
    },
    onError: (error) => {
      toast({
        title: i18n.t('common.error'),
        description: i18n.t('trafficViolation.error'),
        variant: "destructive"
      });
      console.error('Error submitting violation report:', error);
    }
  });
  
  const onSubmit = (data: ViolationReportFormData) => {
    submitMutation.mutate(data);
  };
  
  const handleReset = () => {
    reset();
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-[#1E1E1E]">
        <h2 className="text-2xl font-bold">{i18n.t('trafficViolation.title')}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Violation Information */}
          <div className="bg-[#1E1E1E] p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{i18n.t('trafficViolation.violationInfo.title')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">{i18n.t('trafficViolation.violationInfo.dateTime')}</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("dateTime")}
                />
                {errors.dateTime && <p className="text-red-500 text-sm mt-1">{errors.dateTime.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('trafficViolation.violationInfo.location')}</label>
                <input 
                  type="text" 
                  placeholder={i18n.t('trafficViolation.violationInfo.locationPlaceholder')} 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("location")}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('trafficViolation.violationInfo.violationType')}</label>
                <select 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("violationType")}
                >
                  <option value="">{i18n.t('trafficViolation.violationTypes.select')}</option>
                  <option value="speeding">{i18n.t('trafficViolation.violationTypes.speeding')}</option>
                  <option value="redLight">{i18n.t('trafficViolation.violationTypes.redLight')}</option>
                  <option value="stopSign">{i18n.t('trafficViolation.violationTypes.stopSign')}</option>
                  <option value="dui">{i18n.t('trafficViolation.violationTypes.dui')}</option>
                  <option value="noLicense">{i18n.t('trafficViolation.violationTypes.noLicense')}</option>
                  <option value="reckless">{i18n.t('trafficViolation.violationTypes.reckless')}</option>
                  <option value="other">{i18n.t('trafficViolation.violationTypes.other')}</option>
                </select>
                {errors.violationType && <p className="text-red-500 text-sm mt-1">{errors.violationType.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('trafficViolation.violationInfo.severity')}</label>
                <select 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("severity")}
                >
                  <option value="">{i18n.t('trafficViolation.severityLevels.select')}</option>
                  <option value="minor">{i18n.t('trafficViolation.severityLevels.minor')}</option>
                  <option value="moderate">{i18n.t('trafficViolation.severityLevels.moderate')}</option>
                  <option value="severe">{i18n.t('trafficViolation.severityLevels.severe')}</option>
                  <option value="critical">{i18n.t('trafficViolation.severityLevels.critical')}</option>
                </select>
                {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity.message}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-1">{i18n.t('trafficViolation.violationInfo.description')}</label>
                <textarea 
                  rows={3} 
                  placeholder={i18n.t('trafficViolation.violationInfo.descriptionPlaceholder')} 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("description")}
                ></textarea>
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
            </div>
          </div>
          
          {/* Vehicle & Driver Information */}
          <div className="bg-[#1E1E1E] p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{i18n.t('trafficViolation.driverInfo.title')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">{i18n.t('trafficViolation.driverInfo.licensePlate')}</label>
                <input 
                  type="text" 
                  placeholder={i18n.t('trafficViolation.driverInfo.licensePlatePlaceholder')} 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("licensePlate")}
                />
                {errors.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.licensePlate.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('trafficViolation.driverInfo.makeModel')}</label>
                <input 
                  type="text" 
                  placeholder={i18n.t('trafficViolation.driverInfo.makeModelPlaceholder')} 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("makeModel")}
                />
                {errors.makeModel && <p className="text-red-500 text-sm mt-1">{errors.makeModel.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('trafficViolation.driverInfo.driverName')}</label>
                <input 
                  type="text" 
                  placeholder={i18n.t('trafficViolation.driverInfo.driverNamePlaceholder')} 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("driverName")}
                />
                {errors.driverName && <p className="text-red-500 text-sm mt-1">{errors.driverName.message}</p>}
              </div>
              
              <div>
                <label className="block mb-1">{i18n.t('trafficViolation.driverInfo.licenseNumber')}</label>
                <input 
                  type="text" 
                  placeholder={i18n.t('trafficViolation.driverInfo.licenseNumberPlaceholder')} 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("licenseNumber")}
                />
                {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber.message}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-1">{i18n.t('trafficViolation.driverInfo.notes')}</label>
                <textarea 
                  rows={2} 
                  placeholder={i18n.t('trafficViolation.driverInfo.notesPlaceholder')}
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("notes")}
                ></textarea>
                {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              className="px-6 py-3 rounded-lg bg-[#2D2D2D] text-[#f89422] font-bold"
              onClick={handleReset}
            >
              {i18n.t('trafficViolation.reset')}
            </Button>
            <Button
              type="submit"
              className="px-6 py-3 rounded-lg bg-[#f89422] text-[#121212] font-bold"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? i18n.t('common.loading') : i18n.t('trafficViolation.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrafficViolationPanel;
