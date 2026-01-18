import React, { useState } from 'react';
import { AppType, GeneratedContent, AspectRatio, ProjectInfo, SceneData, BrandingResult, CLOTHING_OPTIONS, TOWNHOUSE_OUTFITS, RATIO_OPTIONS, BRANDING_BACKGROUNDS, BRANDING_STYLES, BRANDING_TONES } from '../types';
import { APPS } from '../constants';
import { generateMaterials, generateCharacterImage, generateRealEstateMaterials, generateBrandAssets, generateTownhouseMaterials, regenerateSceneImage } from '../services/geminiService';
import { 
  ArrowDownTrayIcon, 
  DocumentDuplicateIcon, 
  ClipboardDocumentCheckIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
  SwatchIcon,
  ChatBubbleBottomCenterTextIcon,
  Square2StackIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
// Import Lucide Icons
import { 
  LandPlot, 
  Home, 
  Sparkles, 
  Building2, 
  Megaphone, 
  CheckCircle2, 
  Copy, 
  Download,
  Loader2
} from 'lucide-react';

interface WorkspaceProps {
  selectedApp: AppType;
}

// Icon Mapping
const APP_ICONS = {
  [AppType.BRANDING]: Sparkles,
  [AppType.TOWNHOUSE]: Home,
  [AppType.LAND]: LandPlot
};

export const Workspace: React.FC<WorkspaceProps> = ({ selectedApp }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  
  // === STATES: LAND APP ===
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({ description: '', utilities: '', cta: '' });
  const [clothingStyle, setClothingStyle] = useState<string>(CLOTHING_OPTIONS[0].id);
  const [customClothingText, setCustomClothingText] = useState<string>(''); 
  const [sceneCount, setSceneCount] = useState<number>(3);
  const [customSceneCount, setCustomSceneCount] = useState<string>('');
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [landScenes, setLandScenes] = useState<SceneData[]>([]); // Result for Land
  
  // === STATES: TOWNHOUSE APP ===
  const [townhouseOutfit, setTownhouseOutfit] = useState<string>(TOWNHOUSE_OUTFITS[0].id);
  const [customTownhouseOutfit, setCustomTownhouseOutfit] = useState<string>('');
  const [townhouseScenes, setTownhouseScenes] = useState<SceneData[]>([]); // Result for Townhouse

  // === STATES: BRANDING APP ===
  const [brandingTopic, setBrandingTopic] = useState<string>(''); 
  const [brandingBg, setBrandingBg] = useState<string>(BRANDING_BACKGROUNDS[0].id);
  const [customBrandingBg, setCustomBrandingBg] = useState<string>('');
  const [brandingStyle, setBrandingStyle] = useState<string>(BRANDING_STYLES[0].label);
  const [brandingTone, setBrandingTone] = useState<string>(BRANDING_TONES[0].label);
  const [brandingQuantity, setBrandingQuantity] = useState<number>(3);
  const [brandingResult, setBrandingResult] = useState<BrandingResult | null>(null); // Result for Branding

  // === SHARED / LEGACY ===
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const activeAppConfig = APPS.find(app => app.id === selectedApp);
  const HeaderIcon = APP_ICONS[selectedApp] || Sparkles;

  // Reset state on app change
  React.useEffect(() => {
    setPortraitImage(null);
    setProjectImages([]);
    
    // Reset Results
    setLandScenes([]);
    setTownhouseScenes([]);
    setBrandingResult(null);
    
    setError(null);
    setProgress(0);
    
    // Reset inputs
    setProjectInfo({ description: '', utilities: '', cta: '' });
    setBrandingTopic('');
    setBrandingBg(BRANDING_BACKGROUNDS[0].id);
    setSceneCount(3);
    setTownhouseOutfit(TOWNHOUSE_OUTFITS[0].id);
  }, [selectedApp]);

  // --- Helpers ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, isProject: boolean) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
    };
    try {
      if (isProject) {
        const newImages: string[] = [];
        for (let i = 0; i < files.length; i++) newImages.push(await fileToBase64(files[i]));
        setProjectImages(prev => [...prev, ...newImages]);
      } else {
        setPortraitImage(await fileToBase64(files[0]));
      }
    } catch (e) {
      setError("Lỗi đọc file ảnh.");
    }
  };

  const handleCopy = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const convertBase64ToWebP = async (base64: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/png;base64,${base64}`;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => { resolve(blob!); }, 'image/webp', 0.9);
      };
    });
  };

  const handleDownloadImage = async (base64: string, filename: string) => {
    try {
      const blob = await convertBase64ToWebP(base64);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error", e);
    }
  };

  const handleDownloadAllImages = async (scenes: SceneData[]) => {
    if (scenes.length === 0) return;
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].imageBase64) {
         await handleDownloadImage(scenes[i].imageBase64!, `scene_${i + 1}.webp`);
         await new Promise(r => setTimeout(r, 200));
      }
    }
  };

  // NEW: Download Scripts Text
  const handleDownloadScripts = (items: any[], type: 'branding' | 'scene') => {
    let content = "";
    
    // Add Hook and Hashtags for Branding
    if (type === 'branding' && brandingResult) {
       content += `HOOK: ${brandingResult.hookHeadline}\n`;
       content += `HASHTAGS: ${brandingResult.hashtags.join(' ')}\n`;
       content += "\n==================================================\n\n";
    }

    items.forEach((item, index) => {
        const idx = index + 1;
        content += `Cảnh ${idx}: ${item.title || ''}\n\n`;
        content += `Prompt Veo: ${item.veoPrompt || ''}\n\n`;
        content += `Lời thoại: ${item.script}\n`;
        content += "\n--------------------------------------------------\n\n";
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = type === 'branding' ? 'Kich_ban_Thuong_hieu.txt' : 'Kich_ban_BDS.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSceneCountChange = (val: number | 'custom') => {
    if (val === 'custom') setSceneCount(-1);
    else setSceneCount(val);
  };

  // === REGENERATION HANDLERS ===
  const toggleEditMode = (idx: number) => {
    const isLand = selectedApp === AppType.LAND;
    const setter = isLand ? setLandScenes : setTownhouseScenes;
    
    setter(prev => prev.map((scene, i) => 
      i === idx ? { ...scene, isEditing: !scene.isEditing, feedback: '' } : scene
    ));
  };

  const handleFeedbackChange = (idx: number, text: string) => {
    const isLand = selectedApp === AppType.LAND;
    const setter = isLand ? setLandScenes : setTownhouseScenes;
    
    setter(prev => prev.map((scene, i) => 
      i === idx ? { ...scene, feedback: text } : scene
    ));
  };

  const handleRegenerateSubmit = async (idx: number) => {
    const isLand = selectedApp === AppType.LAND;
    const scenes = isLand ? landScenes : townhouseScenes;
    const setter = isLand ? setLandScenes : setTownhouseScenes;
    const targetScene = scenes[idx];

    if (!targetScene.feedback || !targetScene.feedback.trim()) return;

    // Start loading state
    setter(prev => prev.map((s, i) => i === idx ? { ...s, isLoadingImage: true, isEditing: false } : s));

    try {
        let bgImage = null;
        if (projectImages.length > 0) {
            bgImage = projectImages[idx % projectImages.length];
        }

        const newImage = await regenerateSceneImage(
            targetScene.visualPrompt,
            targetScene.feedback,
            aspectRatio,
            portraitImage,
            bgImage
        );

        // Update with new image
        setter(prev => prev.map((s, i) => 
            i === idx ? { ...s, imageBase64: newImage, isLoadingImage: false, feedback: '' } : s
        ));
    } catch (e: any) {
        console.error("Regeneration failed", e);
        setError(`Vẽ lại thất bại: ${e.message}`);
        setter(prev => prev.map((s, i) => i === idx ? { ...s, isLoadingImage: false } : s));
    }
  };


  // --- Main Generate Logic ---
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setProgress(10); 

    try {
      const finalSceneCount = sceneCount === -1 ? (parseInt(customSceneCount) || 3) : sceneCount;

      if (selectedApp === AppType.BRANDING) {
        // === BRANDING LOGIC ===
        setBrandingResult(null);
        let finalBg = brandingBg;
        if (brandingBg === 'custom') {
          finalBg = customBrandingBg || "Professional Studio";
        } else {
          const bgObj = BRANDING_BACKGROUNDS.find(b => b.id === brandingBg);
          finalBg = bgObj ? bgObj.label : brandingBg;
        }

        const result = await generateBrandAssets(portraitImage, brandingTopic, finalBg, brandingStyle, brandingTone, brandingQuantity);
        setBrandingResult(result);
        setProgress(40);

        const masterImage = await generateCharacterImage(result.masterVisualPrompt, aspectRatio, portraitImage);
        setBrandingResult({ ...result, masterImageBase64: masterImage });
        setProgress(100);

      } else if (selectedApp === AppType.LAND) {
        // === LAND LOGIC ===
        setLandScenes([]);
        let finalClothingDesc = clothingStyle === 'custom' ? (customClothingText || 'Professional Attire') : '';
        if (!finalClothingDesc) {
           const opt = CLOTHING_OPTIONS.find(o => o.id === clothingStyle);
           finalClothingDesc = opt ? opt.label : 'Professional Attire';
        }

        const generatedScenes = await generateRealEstateMaterials(selectedApp, portraitImage, projectImages, projectInfo, finalClothingDesc, finalSceneCount);
        setLandScenes(generatedScenes);
        setProgress(30); 

        const updatedScenes = [...generatedScenes];
        for (let i = 0; i < updatedScenes.length; i++) {
          try {
            setLandScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isLoadingImage: true } : s));
            const imageBase64 = await generateCharacterImage(updatedScenes[i].visualPrompt, aspectRatio, portraitImage);
            setLandScenes(prev => prev.map((s, idx) => idx === i ? { ...s, imageBase64, isLoadingImage: false } : s));
            setProgress(30 + Math.floor(((i + 1) / updatedScenes.length) * 70));
          } catch (err) {
             setLandScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isLoadingImage: false } : s));
          }
        }
        setProgress(100);

      } else if (selectedApp === AppType.TOWNHOUSE) {
        // === TOWNHOUSE LOGIC ===
        setTownhouseScenes([]);
        
        // Resolve Outfit
        let finalOutfit = townhouseOutfit === 'custom' ? customTownhouseOutfit : '';
        if (!finalOutfit) {
           const opt = TOWNHOUSE_OUTFITS.find(o => o.id === townhouseOutfit);
           finalOutfit = opt ? opt.label : 'Smart Casual';
        }

        // 1. Generate Scenes (Text)
        const generatedScenes = await generateTownhouseMaterials(
          portraitImage, // Ensure this is PASSED correctly for prompt understanding
          projectImages,
          projectInfo,
          finalOutfit,
          finalSceneCount
        );
        setTownhouseScenes(generatedScenes);
        setProgress(30);

        // 2. Generate Images with Background Injection
        const updatedScenes = [...generatedScenes];
        for (let i = 0; i < updatedScenes.length; i++) {
          try {
            setTownhouseScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isLoadingImage: true } : s));
            
            // SELECT BACKGROUND: Cycle through project images or use the first one if only one exists
            let bgImage = null;
            if (projectImages.length > 0) {
              bgImage = projectImages[i % projectImages.length];
            }

            // PASS BOTH: portraitImage (Identity) AND bgImage (Background)
            const imageBase64 = await generateCharacterImage(updatedScenes[i].visualPrompt, aspectRatio, portraitImage, bgImage);
            
            setTownhouseScenes(prev => prev.map((s, idx) => idx === i ? { ...s, imageBase64, isLoadingImage: false } : s));
            setProgress(30 + Math.floor(((i + 1) / updatedScenes.length) * 70));
          } catch (err) {
             setTownhouseScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isLoadingImage: false } : s));
          }
        }
        setProgress(100);
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  const getAspectRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16': return 'aspect-[9/16]';
      case '16:9': return 'aspect-[16/9]';
      case '1:1': return 'aspect-square';
      default: return 'aspect-[9/16]';
    }
  };

  if (!activeAppConfig) return null;

  // Determine active scenes list based on app type for rendering logic
  const activeScenes = selectedApp === AppType.TOWNHOUSE ? townhouseScenes : landScenes;

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-slate-50 relative font-sans">
      <div className="flex flex-col xl:flex-row min-h-full">
        
        {/* ================= LEFT COLUMN: INPUTS ================= */}
        {/* Mobile Optimization: Add pb-32 to allow scrolling past bottom nav/keyboard */}
        <div className="w-full xl:w-[480px] bg-white border-r border-gray-200 p-4 md:p-8 flex-shrink-0 flex flex-col gap-8 overflow-y-auto h-auto xl:h-screen z-10 shadow-[4px_0_24px_rgba(0,0,0,0.01)] pb-32 md:pb-8">
          
          <div className="mb-2">
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className={`p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-100 border border-slate-200 text-indigo-600 shadow-sm`}>
                <HeaderIcon size={32} strokeWidth={1.5} />
              </span>
              {activeAppConfig.label}
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{activeAppConfig.description}</p>
          </div>

          {/* 1. AGENT IMAGE (SHARED) - ALWAYS VISIBLE */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <UserCircleIcon className="w-4 h-4 text-indigo-500" />
              1. Ảnh Đại Diện (Agent)
            </label>
            <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors group">
              <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                {portraitImage ? (
                  <img src={`data:image/png;base64,${portraitImage}`} className="w-full h-full object-cover" alt="Agent" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UserCircleIcon className="w-10 h-10" />
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, false)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
            </div>
          </div>

          {/* 2. SPECIFIC INPUTS: CONDITIONAL RENDERING */}
          
          {/* === BRANDING INPUTS === */}
          {selectedApp === AppType.BRANDING && (
            <div className="space-y-6 pt-2 animate-fadeIn">
               <div className="relative">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1 tracking-wider">Nội dung chia sẻ</label>
                <div className="relative group">
                   <PencilSquareIcon className="w-5 h-5 text-gray-400 absolute top-3.5 left-3.5 group-focus-within:text-indigo-500 transition-colors" />
                   <textarea 
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-h-[120px] shadow-sm resize-none bg-slate-50 focus:bg-white transition-all"
                    placeholder="Nhập chủ đề hoặc nội dung chính bạn muốn nói trong video..."
                    value={brandingTopic}
                    onChange={(e) => setBrandingTopic(e.target.value)}
                  />
                </div>
              </div>

               <div>
                 <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider">
                   <PhotoIcon className="w-4 h-4" /> Bối cảnh (Background)
                 </label>
                 <select 
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm mb-2"
                    value={brandingBg}
                    onChange={(e) => setBrandingBg(e.target.value)}
                 >
                   {BRANDING_BACKGROUNDS.map(opt => (
                     <option key={opt.id} value={opt.id}>{opt.label}</option>
                   ))}
                 </select>
                 {brandingBg === 'custom' && (
                     <input
                        type="text"
                        className="w-full p-3 border border-indigo-200 rounded-xl text-sm bg-indigo-50 focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="Mô tả bối cảnh (VD: Sân khấu TED Talk, Bãi biển...)"
                        value={customBrandingBg}
                        onChange={(e) => setCustomBrandingBg(e.target.value)}
                     />
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider"><SwatchIcon className="w-4 h-4" /> Phong cách</label>
                     <select className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" value={brandingStyle} onChange={(e) => setBrandingStyle(e.target.value)}>
                     {BRANDING_STYLES.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider"><ChatBubbleBottomCenterTextIcon className="w-4 h-4" /> Tông giọng</label>
                     <select className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" value={brandingTone} onChange={(e) => setBrandingTone(e.target.value)}>
                     {BRANDING_TONES.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider"><Square2StackIcon className="w-4 h-4" /> Biến thể</label>
                   <select className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-center font-semibold" value={brandingQuantity} onChange={(e) => setBrandingQuantity(parseInt(e.target.value))}>
                     {Array.from({length: 10}, (_, i) => i + 1).map(num => <option key={num} value={num}>{num} Kịch bản</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider">Tỷ lệ</label>
                   <select className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-center" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}>
                     {RATIO_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                 </div>
               </div>
            </div>
          )}

          {/* === LAND & TOWNHOUSE SHARED INPUTS (Logic differs slightly) === */}
          {(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) && (
            <>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <PhotoIcon className="w-4 h-4 text-emerald-500" />
                2. {selectedApp === AppType.LAND ? 'Ảnh Dự Án (Đất)' : 'Ảnh Nội Thất (Nhà)'}
              </label>
              <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors group">
                 <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 relative shadow-sm group-hover:shadow-md transition-all">
                  {projectImages.length > 0 ? (
                    <>
                      <img src={`data:image/png;base64,${projectImages[0]}`} className="w-full h-full object-cover" alt="Project" />
                      {projectImages.length > 1 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">+{projectImages.length - 1}</div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <PhotoIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, true)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <div className="relative">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1 tracking-wider">
                    {selectedApp === AppType.LAND ? 'Mô tả Đất Nền' : 'Thông tin căn hộ'}
                </label>
                <div className="relative group">
                   {selectedApp === AppType.LAND ? <LandPlot className="w-5 h-5 text-gray-400 absolute top-3.5 left-3.5 group-focus-within:text-indigo-500 transition-colors" /> : <Building2 className="w-5 h-5 text-gray-400 absolute top-3.5 left-3.5 group-focus-within:text-indigo-500 transition-colors" />}
                   <textarea className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-h-[100px] shadow-sm resize-none bg-slate-50 focus:bg-white transition-all" 
                     placeholder={selectedApp === AppType.LAND ? "Ví dụ: Đất lô góc, view hồ..." : "Ví dụ: Căn hộ 2PN, phong cách Indochine..."} 
                     value={projectInfo.description} 
                     onChange={(e) => setProjectInfo({...projectInfo, description: e.target.value})} />
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1 tracking-wider">
                    {selectedApp === AppType.LAND ? 'Tiện ích' : 'Điểm nhấn (Highlight)'}
                </label>
                 <div className="relative group">
                  <Sparkles className="w-5 h-5 text-gray-400 absolute top-3.5 left-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input type="text" className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm bg-slate-50 focus:bg-white transition-all" 
                     placeholder="Gần chợ, trường học, ban công rộng..." 
                     value={projectInfo.utilities} 
                     onChange={(e) => setProjectInfo({...projectInfo, utilities: e.target.value})} />
                </div>
              </div>
              
              {selectedApp === AppType.LAND && (
                  <div className="relative">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1 tracking-wider">Call To Action</label>
                    <div className="relative group">
                      <Megaphone className="w-5 h-5 text-gray-400 absolute top-3.5 left-3.5 group-focus-within:text-indigo-500 transition-colors" />
                      <input type="text" className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm bg-slate-50 focus:bg-white transition-all" placeholder="Liên hệ ngay..." value={projectInfo.cta} onChange={(e) => setProjectInfo({...projectInfo, cta: e.target.value})} />
                    </div>
                  </div>
              )}
              
              <div className="grid grid-cols-1 gap-6 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <div>
                   <label className="block text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider">Số lượng cảnh</label>
                   <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                     {[3, 5, 7].map(num => (
                       <button key={num} onClick={() => handleSceneCountChange(num)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${sceneCount === num ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>{num}</button>
                     ))}
                     <button onClick={() => handleSceneCountChange('custom')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${sceneCount === -1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Khác</button>
                   </div>
                   {sceneCount === -1 && (
                     <div className="mt-2"><input type="number" placeholder="Số cảnh" className="w-full p-2 text-sm border border-indigo-200 rounded-lg text-center" value={customSceneCount} onChange={(e) => setCustomSceneCount(e.target.value)} /></div>
                   )}
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider">Trang phục</label>
                   
                   {selectedApp === AppType.LAND ? (
                       // LAND OUTFITS
                       <>
                       <select className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={clothingStyle} onChange={(e) => setClothingStyle(e.target.value)}>
                         {CLOTHING_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label.split('(')[0]}</option>)}
                       </select>
                       {clothingStyle === 'custom' && (
                         <input type="text" className="w-full mt-2 p-3 border border-indigo-200 rounded-xl text-sm bg-indigo-50" placeholder="Mô tả trang phục..." value={customClothingText} onChange={(e) => setCustomClothingText(e.target.value)} />
                       )}
                       </>
                   ) : (
                       // TOWNHOUSE OUTFITS
                       <>
                       <select className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={townhouseOutfit} onChange={(e) => setTownhouseOutfit(e.target.value)}>
                         {TOWNHOUSE_OUTFITS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                       </select>
                       {townhouseOutfit === 'custom' && (
                         <input type="text" className="w-full mt-2 p-3 border border-indigo-200 rounded-xl text-sm bg-indigo-50" placeholder="Mô tả trang phục..." value={customTownhouseOutfit} onChange={(e) => setCustomTownhouseOutfit(e.target.value)} />
                       )}
                       </>
                   )}
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider">Tỷ lệ</label>
                   <select className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}>
                     {RATIO_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
              </div>
            </div>
            </>
          )}

          {/* GENERATE BUTTON */}
          <div className="mt-auto pt-4">
            {error && <p className="text-red-500 text-sm mb-3 font-medium bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 relative overflow-hidden
                ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600'}
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  <span>Đang xử lý... {progress}%</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Phân tích & Tạo Nội dung</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: RESULTS ================= */}
        {/* Mobile Optimization: pb-32 for bottom nav clearance */}
        <div className="flex-1 bg-slate-50 relative overflow-y-auto h-screen scroll-smooth pb-32 md:pb-0">
          
          {/* STICKY HEADER ACTIONS */}
          {(landScenes.length > 0 || brandingResult || townhouseScenes.length > 0) && (
             <div className="sticky top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-2 flex items-center justify-between shadow-sm transition-all">
                <div className="flex items-center gap-3">
                   <h2 className="text-lg md:text-xl font-bold text-slate-800">
                      {selectedApp === AppType.BRANDING && 'Kế hoạch Nội dung'}
                      {selectedApp === AppType.LAND && 'Kịch bản Video BĐS'}
                      {selectedApp === AppType.TOWNHOUSE && 'Review Nhà Phố'}
                   </h2>
                   <span className="hidden md:inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                     {activeScenes.length > 0 ? `${activeScenes.length} Scenes` : 'Result'}
                   </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* BUTTON 1: Download Scripts (BRANDING) */}
                    {selectedApp === AppType.BRANDING && brandingResult && (
                        <button 
                            onClick={() => handleDownloadScripts(brandingResult.variations, 'branding')}
                            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-slate-800 text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
                        >
                            <DocumentTextIcon className="w-4 h-4" />
                            <span className="hidden md:inline">Tải Kịch bản (.txt)</span>
                            <span className="md:hidden">Kịch bản</span>
                        </button>
                    )}

                    {/* BUTTON 2: Download Scripts (LAND & TOWNHOUSE) */}
                    {(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) && (
                        <button 
                            onClick={() => handleDownloadScripts(activeScenes, 'scene')}
                            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-slate-800 text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
                        >
                            <DocumentTextIcon className="w-4 h-4" />
                            <span className="hidden md:inline">Tải Kịch bản (.txt)</span>
                            <span className="md:hidden">Kịch bản</span>
                        </button>
                    )}

                    {/* BUTTON 3: Download Images (LAND & TOWNHOUSE) */}
                    {(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) && (
                    <button 
                        onClick={() => handleDownloadAllImages(selectedApp === AppType.TOWNHOUSE ? townhouseScenes : landScenes)}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-indigo-600 text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                        <Download className="w-4 h-4" />
                        <span className="hidden md:inline">Tải tất cả (.webp)</span>
                        <span className="md:hidden">Tải ảnh</span>
                    </button>
                    )}
                </div>
             </div>
          )}

          {/* Mobile Optimization: Reduce padding from p-6 md:p-10 to p-3 md:p-4 */}
          <div className="max-w-5xl mx-auto p-3 md:p-4">
             
             {/* EMPTY STATE */}
             {!loading && landScenes.length === 0 && !townhouseScenes.length && !brandingResult && (
                <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 animate-bounce-slow">
                     <AdjustmentsHorizontalIcon className="w-12 h-12 text-indigo-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">Studio Sáng Tạo</h3>
                  <p className="max-w-sm text-center mt-3 text-slate-500 leading-relaxed">Chọn loại ứng dụng bên trái để bắt đầu.</p>
                </div>
             )}

             {/* PREMIUM LOADING STATE */}
             {loading && (
               <div className="flex flex-col items-center justify-center h-[60vh] gap-8 animate-fadeIn">
                  {/* Progress Bar */}
                  <div className="w-full max-w-md relative">
                    <div className="flex justify-between mb-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
                       <span>Processing</span>
                       <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-full animate-pulse transition-transform duration-300 ease-out origin-left" style={{ transform: `scaleX(${progress / 100})` }}></div>
                    </div>
                  </div>
                  
                  {/* Skeleton Preview */}
                  <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-sm border border-slate-100 opacity-60">
                     <div className="flex gap-4">
                        <div className="w-1/3 aspect-[9/16] bg-slate-100 rounded-xl animate-pulse"></div>
                        <div className="flex-1 space-y-4 py-2">
                           <div className="h-6 bg-slate-100 rounded-lg w-3/4 animate-pulse"></div>
                           <div className="space-y-2">
                              <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                              <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                              <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse"></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {/* === BRANDING RESULT UI === */}
             {selectedApp === AppType.BRANDING && brandingResult && (
                <div className="space-y-8 animate-fadeIn">
                    
                    {/* NEW: HOOK & HASHTAGS BLOCK */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm relative group hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest bg-amber-100 px-2 py-1 rounded-md">Viral Hook</span>
                        </div>
                        <button 
                            onClick={() => {
                              const text = `HOOK: ${brandingResult.hookHeadline}\n\nHASHTAGS: ${brandingResult.hashtags.join(' ')}`;
                              handleCopy(text, 'hook-hashtags');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copiedId === 'hook-hashtags' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-amber-600 hover:bg-amber-100 shadow-sm border border-amber-100'}`}
                          >
                             {copiedId === 'hook-hashtags' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                             <span>{copiedId === 'hook-hashtags' ? 'Copied' : 'Copy'}</span>
                          </button>
                      </div>
                      
                      <div className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                          {brandingResult.hookHeadline}
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                          {brandingResult.hashtags.map((tag, i) => (
                            <span key={i} className="text-xs font-semibold text-amber-700 bg-amber-100/50 px-2 py-1 rounded-md">
                              #{tag.replace(/^#/, '')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-8 items-start">
                        <div className={`w-full md:w-1/3 bg-slate-100 rounded-2xl overflow-hidden shadow-inner ${getAspectRatioClass(aspectRatio)}`}>
                            {brandingResult.masterImageBase64 ? (
                                <img src={`data:image/png;base64,${brandingResult.masterImageBase64}`} className="w-full h-full object-cover" alt="Master Identity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-4">
                            <h3 className="text-2xl font-bold text-slate-900">Ảnh Master</h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Visual Prompt</span>
                                <p className="text-xs text-slate-600 font-mono leading-relaxed">{brandingResult.masterVisualPrompt}</p>
                            </div>
                            {brandingResult.masterImageBase64 && (
                                <button onClick={() => handleDownloadImage(brandingResult.masterImageBase64!, 'master_identity.webp')} className="mt-4 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
                                    <ArrowDownTrayIcon className="w-5 h-5" /><span>Tải ảnh Master (.webp)</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <h3 className="text-xl font-bold text-slate-800 ml-2">Các biến thể kịch bản ({brandingResult.variations.length})</h3>
                        {brandingResult.variations.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-xl md:rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">{idx + 1}</div>
                                        <h4 className="font-bold text-base md:text-lg text-slate-800 line-clamp-1">{item.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => {
                                                const text = `${item.veoPrompt}\n${item.script}`;
                                                handleCopy(text, `brand-all-${idx}`);
                                            }}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${copiedId === `brand-all-${idx}` ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                            title="Copy Veo Prompt + Script"
                                        >
                                            {copiedId === `brand-all-${idx}` ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5"/><span>Copied</span></>
                                            ) : (
                                                <><Copy className="w-3.5 h-3.5"/><span>Copy All</span></>
                                            )}
                                        </button>
                                        <button onClick={() => handleCopy(item.script, `script-${idx}`)} className={`p-1.5 rounded-lg transition-colors border ${copiedId === `script-${idx}` ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-400 hover:bg-slate-50 border-slate-200'}`} title="Chỉ copy lời thoại">
                                            {copiedId === `script-${idx}` ? <CheckCircle2 className="w-4 h-4"/> : <ChatBubbleBottomCenterTextIcon className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="bg-gradient-to-br from-indigo-50/50 to-white p-3 rounded-xl border border-indigo-100/50">
                                        <p className="text-slate-700 text-sm md:text-base font-medium leading-relaxed italic">"{item.script}"</p>
                                    </div>
                                    <div className="text-[10px] md:text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="font-bold text-slate-400 block mb-1">Veo Prompt:</span>
                                        {item.veoPrompt}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             {/* === LAND & TOWNHOUSE RESULT UI (Shared Structure) === */}
             {(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) && activeScenes.length > 0 && (
               <div className={`mt-1 ${selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE ? 'space-y-0.5 gap-1 grid grid-cols-1' : 'space-y-4'}`}>
                 {activeScenes.map((scene, index) => (
                   <div key={index} className={`bg-white rounded-[1rem] md:rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden group/card hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 w-full`}>
                     <div className="grid grid-cols-1 md:grid-cols-12 h-full">
                        <div className={`md:col-span-5 bg-slate-100 relative overflow-hidden group/image ${getAspectRatioClass(aspectRatio)}`}>
                          {scene.imageBase64 ? (
                            <>
                              <img src={`data:image/png;base64,${scene.imageBase64}`} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" alt={`Scene ${index + 1}`} />
                              
                              {/* REGENERATE OVERLAY (Visible on Hover or Editing) */}
                              {!scene.isEditing && !scene.isLoadingImage && (
                                <button 
                                  onClick={() => toggleEditMode(index)}
                                  className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-all transform translate-y-2 group-hover/image:translate-y-0 flex items-center gap-1.5 z-10"
                                >
                                  <ArrowPathIcon className="w-3.5 h-3.5" />
                                  <span>Vẽ lại</span>
                                </button>
                              )}

                              {/* REGENERATE INPUT FORM */}
                              {scene.isEditing && (
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-white/95 backdrop-blur-md border-t border-indigo-100 z-20 flex flex-col gap-2 animate-fadeIn">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="text" 
                                      placeholder="Yêu cầu (VD: Cười tươi hơn...)" 
                                      className="flex-1 text-xs p-2 rounded-lg border border-indigo-200 bg-indigo-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                      value={scene.feedback || ''}
                                      onChange={(e) => handleFeedbackChange(index, e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleRegenerateSubmit(index)}
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleRegenerateSubmit(index)}
                                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                                    >
                                      <PaperAirplaneIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => toggleEditMode(index)}
                                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                    >
                                      <XMarkIcon className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                               {scene.isLoadingImage ? (
                                 <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 bg-white/80 z-20 backdrop-blur-[2px]">
                                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3 shadow-lg"></div>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">Processing</span>
                                 </div>
                               ) : (<PhotoIcon className="w-12 h-12 text-slate-300" />)}
                            </div>
                          )}
                          
                          {/* Spinner Overlay when Regenerating (Pre-existing Image) */}
                          {scene.imageBase64 && scene.isLoadingImage && (
                              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center">
                                  <div className="w-10 h-10 border-4 border-white border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
                              </div>
                          )}

                          <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-white/90 backdrop-blur-md text-slate-900 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-sm z-10 border border-white/50 uppercase tracking-widest">Scene {String(index + 1).padStart(2, '0')}</div>
                        </div>
                        {/* Spacing optimization: Apply compact padding/gap for Real Estate apps */}
                        <div className={`md:col-span-7 flex flex-col relative ${(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) ? 'p-3 gap-0.5' : 'p-6 gap-3'}`}>
                           {/* Mobile Copy Button: Full width at top of content, Desktop: Absolute top right */}
                           <div className="block md:absolute md:top-3 md:right-3 mb-1 md:mb-0 z-10">
                              <button onClick={() => { 
                                  const text = `${scene.veoPrompt || ''}\n\n${scene.script}`;
                                  handleCopy(text, index + 100); 
                                }} 
                                className={`w-full md:w-auto flex items-center justify-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all border ${copiedId === index + 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-sm'}`}>
                                {copiedId === index + 100 ? <> <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /><span>Copied</span></> : <> <Copy className="w-3 h-3 md:w-4 md:h-4" /><span>Copy All</span></>}
                              </button>
                           </div>
                           
                           {/* Content Container - Compact UI space-y-0.5 for Real Estate */}
                           <div className={`flex flex-col ${(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) ? 'gap-0.5' : 'gap-2'}`}>
                             <h3 className="text-base md:text-lg font-bold text-slate-800 line-clamp-1 mb-0.5">{scene.title}</h3>
                             <div className={`bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all ${(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) ? 'p-2.5' : 'p-4'}`} onClick={() => handleCopy(scene.script, index)}>
                                <p className={`text-slate-700 font-medium leading-relaxed ${(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) ? 'text-sm leading-snug' : 'text-base'}`}>"{scene.script}"</p>
                             </div>
                           </div>

                           <div className={`mt-0 pt-0 ${(selectedApp === AppType.LAND || selectedApp === AppType.TOWNHOUSE) ? 'space-y-0.5' : 'space-y-2'}`}>
                              {scene.veoPrompt && (
                                  <div className="text-[10px] md:text-xs text-slate-500 font-mono bg-orange-50 p-1.5 md:p-2 border border-orange-100 rounded">
                                      <span className="font-bold text-orange-400 inline-block mr-1">Veo:</span>
                                      {scene.veoPrompt}
                                  </div>
                              )}
                              {selectedApp !== AppType.TOWNHOUSE && selectedApp !== AppType.LAND && (
                                <div className="bg-slate-900 text-slate-300 p-2 md:p-3 rounded-xl text-[10px] md:text-xs font-mono line-clamp-2 hover:line-clamp-none transition-all leading-relaxed shadow-inner">{scene.visualPrompt}</div>
                              )}
                           </div>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}

          </div>
        </div>

      </div>
    </main>
  );
};