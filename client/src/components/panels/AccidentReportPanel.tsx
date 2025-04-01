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
  dateTime: z.string().min(1, "Date et heure requises"),
  location: z.string().min(1, "Lieu requis"),
  description: z.string().min(10, "Description trop courte"),
  weatherConditions: z.string().min(1, "Conditions météorologiques requises"),
  roadConditions: z.string().min(1, "État de la route requis"),
  vehicle1: z.object({
    licensePlate: z.string().min(1, "Plaque d'immatriculation requise"),
    makeModel: z.string().min(1, "Marque et modèle requis"),
    year: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 1900 && Number(val) <= new Date().getFullYear() + 1, {
      message: "Année invalide"
    }),
    color: z.string().min(1, "Couleur requise")
  }),
  vehicle2: z.object({
    licensePlate: z.string(),
    makeModel: z.string(),
    year: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 1900 && Number(val) <= new Date().getFullYear() + 1), {
      message: "Année invalide"
    }),
    color: z.string()
  }).optional()
});

type AccidentReportFormData = z.infer<typeof accidentReportSchema>;

const AccidentReportPanel: React.FC = () => {
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AccidentReportFormData>({
    resolver: zodResolver(accidentReportSchema),
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      location: '',
      description: '',
      weatherConditions: '',
      roadConditions: '',
      vehicle1: {
        licensePlate: '',
        makeModel: '',
        year: '',
        color: ''
      },
      vehicle2: {
        licensePlate: '',
        makeModel: '',
        year: '',
        color: ''
      }
    }
  });
  
  const submitMutation = useMutation({
    mutationFn: async (data: AccidentReportFormData) => {
      // Convert form data to the expected API format
      const formattedData = {
        ...data,
        dateTime: new Date(data.dateTime),
        vehicle1: {
          ...data.vehicle1,
          year: parseInt(data.vehicle1.year)
        },
        vehicle2: data.vehicle2 && data.vehicle2.licensePlate ? {
          ...data.vehicle2,
          year: data.vehicle2.year ? parseInt(data.vehicle2.year) : undefined
        } : undefined
      };
      
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
                  placeholder={i18n.t('accidentReport.incidentInfo.locationPlaceholder')} 
                  className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                  {...register("location")}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-1">{i18n.t('accidentReport.incidentInfo.description')}</label>
                <textarea 
                  rows={3} 
                  placeholder={i18n.t('accidentReport.incidentInfo.descriptionPlaceholder')} 
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
            
            {/* Vehicle 1 */}
            <div className="mb-6 pb-6 border-b border-[#2D2D2D]">
              <h4 className="text-lg font-bold mb-3">{i18n.t('accidentReport.vehicleInfo.vehicle1')}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.licensePlate')}</label>
                  <input 
                    type="text" 
                    placeholder={i18n.t('accidentReport.vehicleInfo.licensePlatePlaceholder')} 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.licensePlate")}
                  />
                  {errors.vehicle1?.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.licensePlate.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.makeModel')}</label>
                  <input 
                    type="text" 
                    placeholder={i18n.t('accidentReport.vehicleInfo.makeModelPlaceholder')} 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.makeModel")}
                  />
                  {errors.vehicle1?.makeModel && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.makeModel.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.year')}</label>
                  <input 
                    type="number" 
                    placeholder={i18n.t('accidentReport.vehicleInfo.yearPlaceholder')} 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.year")}
                  />
                  {errors.vehicle1?.year && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.year.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.color')}</label>
                  <input 
                    type="text" 
                    placeholder={i18n.t('accidentReport.vehicleInfo.colorPlaceholder')} 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle1.color")}
                  />
                  {errors.vehicle1?.color && <p className="text-red-500 text-sm mt-1">{errors.vehicle1.color.message}</p>}
                </div>
              </div>
            </div>
            
            {/* Vehicle 2 */}
            <div>
              <h4 className="text-lg font-bold mb-3">{i18n.t('accidentReport.vehicleInfo.vehicle2')}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.licensePlate')}</label>
                  <input 
                    type="text" 
                    placeholder={i18n.t('accidentReport.vehicleInfo.licensePlatePlaceholder')} 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.licensePlate")}
                  />
                  {errors.vehicle2?.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.licensePlate.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.makeModel')}</label>
                  <input 
                    type="text" 
                    placeholder={i18n.t('accidentReport.vehicleInfo.makeModelPlaceholder')} 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.makeModel")}
                  />
                  {errors.vehicle2?.makeModel && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.makeModel.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.year')}</label>
                  <input 
                    type="number" 
                    placeholder={i18n.t('accidentReport.vehicleInfo.yearPlaceholder')} 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.year")}
                  />
                  {errors.vehicle2?.year && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.year.message}</p>}
                </div>
                
                <div>
                  <label className="block mb-1">{i18n.t('accidentReport.vehicleInfo.color')}</label>
                  <input 
                    type="text" 
                    placeholder={i18n.t('accidentReport.vehicleInfo.colorPlaceholder')} 
                    className="w-full p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                    {...register("vehicle2.color")}
                  />
                  {errors.vehicle2?.color && <p className="text-red-500 text-sm mt-1">{errors.vehicle2.color.message}</p>}
                </div>
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
