import { getMachineCleanupService } from "@/lib/services/machine-cleanup";

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing machine cleanup service...');

    try {
      // Check if required environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
        console.warn('⚠️  Supabase not configured - machine cleanup service will not start');
        return;
      }

      // Start the machine cleanup service
      const cleanupService = getMachineCleanupService();
      cleanupService.start();

      console.log('✅ Machine cleanup service started successfully');
    } catch (error) {
      console.error('❌ Failed to start machine cleanup service:', error);
      // Don't throw error to prevent app startup failure
    }

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('🛑 Shutting down services...');
      try {
        const cleanupService = getMachineCleanupService();
        cleanupService.stop();
        console.log('✅ Services shut down successfully');
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
      }
    };

    // Handle shutdown signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('beforeExit', shutdown);
  }
}