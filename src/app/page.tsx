'use client';

import { Screen1Upload } from '@/components/screens/Screen1_Upload';
import { Screen2Questions } from '@/components/screens/Screen2_Questions';
import { Screen3Dashboard } from '@/components/screens/Screen3_Dashboard';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { currentScreen } = useAppStore();

  const screens = ['upload', 'questions', 'dashboard'] as const;
  const currentIndex = screens.indexOf(currentScreen as any);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {screens.map((screen, index) => (
              <div key={screen} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors duration-200
                    ${currentScreen === screen
                      ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                      : index < currentIndex
                        ? 'bg-primary/50 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {index + 1}
                </div>
                {index < screens.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 transition-colors duration-200 ${index < currentIndex
                      ? 'bg-primary/50'
                      : 'bg-muted'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2 text-xs text-muted-foreground font-medium">
            <span className={currentScreen === 'upload' ? 'text-primary' : ''}>Upload</span>
            <span className={currentScreen === 'questions' ? 'text-primary' : ''}>Questions</span>
            <span className={currentScreen === 'dashboard' ? 'text-primary' : ''}>Analyze</span>
          </div>
        </div>

        {/* Screen content */}
        <div className="animate-in fade-in duration-500">
          {currentScreen === 'upload' && <Screen1Upload />}
          {currentScreen === 'questions' && <Screen2Questions />}
          {currentScreen === 'dashboard' && <Screen3Dashboard />}
        </div>
      </div>
    </main>
  );
}
