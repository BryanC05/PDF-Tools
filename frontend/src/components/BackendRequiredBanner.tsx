import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BackendRequiredBannerProps {
    featureName: string;
    description?: string;
}

export function BackendRequiredBanner({ featureName, description }: BackendRequiredBannerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3"
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="font-semibold text-amber-800">
                        {featureName} Requires Backend
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                        {description || 'This feature requires server-side processing and is not available in the browser-only version.'}
                    </p>
                    <p className="text-sm text-amber-700 mt-2">
                        To enable this feature, deploy the optional backend service. See the deployment guide for instructions.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
