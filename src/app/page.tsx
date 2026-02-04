'use client';

import { Screen1Upload } from '@/components/screens/Screen1_Upload';
import { Screen2Questions } from '@/components/screens/Screen2_Questions';
import { Screen3Configure } from '@/components/screens/Screen3_Configure';
import { Screen4Results } from '@/components/screens/Screen4_Results';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { currentScreen } = useAppStore();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {['upload', 'questions', 'configure', 'results'].map((screen, index) => (
              <div key={screen} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors duration-200
                    ${currentScreen === screen
                      ? 'bg-primary text-primary-foreground'
                      : index < ['upload', 'questions', 'configure', 'results'].indexOf(currentScreen)
                        ? 'bg-primary/50 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${index < ['upload', 'questions', 'configure', 'results'].indexOf(currentScreen)
                        ? 'bg-primary/50'
                        : 'bg-muted'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-muted-foreground">
            <span>Upload</span>
            <span>Questions</span>
            <span>Configure</span>
            <span>Results</span>
          </div>
        </div>

        {/* Screen content */}
        {currentScreen === 'upload' && <Screen1Upload />}
        {currentScreen === 'questions' && <Screen2Questions />}
        {currentScreen === 'configure' && <Screen3Configure />}
        {currentScreen === 'results' && <Screen4Results />}
      </div>
    </main>
  );
}
