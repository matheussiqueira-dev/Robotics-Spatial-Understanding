import { useAtom } from 'jotai';
import {
  DrawModeAtom,
  ImageSrcAtom,
  IsLoadingAtom,
  IsUploadedImageAtom,
  SelectedExampleIdAtom,
} from './atoms';
import { useResetState } from './hooks';

export function SideControls() {
  const resetState = useResetState();
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setSelectedExampleId] = useAtom(SelectedExampleIdAtom);
  const [isLoading] = useAtom(IsLoadingAtom);

  return (
    <section className="panel section-card controls-block">
      <div className="section-title">Entrada de imagem</div>

      <label className="btn btn--primary upload-btn">
        <input
          className="hidden-input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              const result = loadEvent.target?.result;
              if (typeof result !== 'string') {
                return;
              }
              resetState();
              setIsUploadedImage(true);
              setSelectedExampleId('upload');
              setImageSrc(result);
            };
            reader.readAsDataURL(file);
          }}
        />
        Upload de imagem
      </label>

      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setDrawMode((current) => !current)}
        disabled={isLoading}>
        {drawMode ? 'Encerrar anotacao' : 'Anotar sobre a imagem'}
      </button>
    </section>
  );
}
