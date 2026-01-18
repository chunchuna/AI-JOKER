import React, { useState } from 'react';
import { generateJokerImage } from '../services/geminiService';
import { AspectRatio, ImageSize } from '../types';

interface Props {
    onClose: () => void;
    onGenerate: (url: string) => void;
}

export const GeneratorModal: React.FC<Props> = ({ onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.RATIO_2_3); // Standard card roughly
    const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setError('');
        
        try {
            const url = await generateJokerImage({ prompt, aspectRatio: ratio, imageSize: size });
            if (url) {
                onGenerate(url);
            } else {
                setError('Failed to generate image. Try a different prompt or check API key.');
            }
        } catch (e) {
            setError('Error generating image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-600 text-white shadow-2xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>🎨</span> Design Your Joker
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Description</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. A cyberpunk clown holding a golden chip"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Aspect Ratio</label>
                            <select 
                                value={ratio} 
                                onChange={e => setRatio(e.target.value as AspectRatio)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm"
                            >
                                {Object.values(AspectRatio).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Size</label>
                            <select 
                                value={size} 
                                onChange={e => setSize(e.target.value as ImageSize)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm"
                            >
                                {Object.values(ImageSize).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-2 rounded bg-slate-700 hover:bg-slate-600 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleGenerate}
                            disabled={loading || !prompt}
                            className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
