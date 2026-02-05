import { useState, useCallback, useRef, useEffect } from 'react';
import type { Invoice, Business, Settings } from '../types';

interface PDFGenerationState {
    isGenerating: boolean;
    progress: number;
    message: string;
    error: string | null;
}

interface UsePDFGeneratorReturn {
    generatePDF: (invoice: Invoice, business: Business, settings: Partial<Settings>) => Promise<Blob>;
    downloadPDF: (invoice: Invoice, business: Business, settings: Partial<Settings>, filename: string) => Promise<void>;
    isGenerating: boolean;
    progress: number;
    message: string;
    error: string | null;
    cancelGeneration: () => void;
}

export const usePDFGenerator = (): UsePDFGeneratorReturn => {
    const [state, setState] = useState<PDFGenerationState>({
        isGenerating: false,
        progress: 0,
        message: '',
        error: null,
    });

    const workerRef = useRef<Worker | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initialize worker
    useEffect(() => {
        // Create worker instance
        workerRef.current = new Worker(
            new URL('../workers/pdfWorker.ts', import.meta.url),
            { type: 'module' }
        );

        return () => {
            // Cleanup worker on unmount
            workerRef.current?.terminate();
        };
    }, []);

    const cancelGeneration = useCallback(() => {
        abortControllerRef.current?.abort();
        setState(prev => ({
            ...prev,
            isGenerating: false,
            error: 'PDF generation cancelled',
        }));
    }, []);

    const generatePDF = useCallback(
        (invoice: Invoice, business: Business, settings: Partial<Settings>): Promise<Blob> => {
            return new Promise((resolve, reject) => {
                if (!workerRef.current) {
                    reject(new Error('PDF Worker not initialized'));
                    return;
                }

                // Create new abort controller for this generation
                abortControllerRef.current = new AbortController();

                setState({
                    isGenerating: true,
                    progress: 0,
                    message: 'Starting PDF generation...',
                    error: null,
                });

                const handleMessage = (e: MessageEvent) => {
                    const { type, progress, message, blob, error } = e.data;

                    switch (type) {
                        case 'progress':
                            setState(prev => ({
                                ...prev,
                                progress,
                                message,
                            }));
                            break;

                        case 'success':
                            setState({
                                isGenerating: false,
                                progress: 100,
                                message: 'PDF generated successfully!',
                                error: null,
                            });
                            workerRef.current?.removeEventListener('message', handleMessage);
                            workerRef.current?.removeEventListener('error', handleError);
                            resolve(blob);
                            break;

                        case 'error':
                            setState({
                                isGenerating: false,
                                progress: 0,
                                message: '',
                                error,
                            });
                            workerRef.current?.removeEventListener('message', handleMessage);
                            workerRef.current?.removeEventListener('error', handleError);
                            reject(new Error(error));
                            break;
                    }
                };

                const handleError = (error: ErrorEvent) => {
                    setState({
                        isGenerating: false,
                        progress: 0,
                        message: '',
                        error: error.message || 'Unknown error occurred',
                    });
                    workerRef.current?.removeEventListener('message', handleMessage);
                    workerRef.current?.removeEventListener('error', handleError);
                    reject(error);
                };

                // Check if generation was cancelled
                if (abortControllerRef.current.signal.aborted) {
                    reject(new Error('PDF generation cancelled'));
                    return;
                }

                workerRef.current.addEventListener('message', handleMessage);
                workerRef.current.addEventListener('error', handleError);

                // Send generation request to worker
                workerRef.current.postMessage({
                    type: 'generate',
                    invoice,
                    business,
                    settings,
                });
            });
        },
        []
    );

    const downloadPDF = useCallback(
        async (invoice: Invoice, business: Business, settings: Partial<Settings>, filename: string): Promise<void> => {
            try {
                const blob = await generatePDF(invoice, business, settings);

                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading PDF:', error);
                throw error;
            }
        },
        [generatePDF]
    );

    return {
        generatePDF,
        downloadPDF,
        isGenerating: state.isGenerating,
        progress: state.progress,
        message: state.message,
        error: state.error,
        cancelGeneration,
    };
};
