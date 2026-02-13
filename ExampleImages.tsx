import {useAtom} from 'jotai';
import React from 'react';
import {
  ImageSrcAtom,
  IsLoadingAtom,
  IsUploadedImageAtom,
  SelectedExampleIdAtom,
} from './atoms';
import {exampleImages} from './consts';
import {useResetState} from './hooks';

export function ExampleImages() {
  const resetState = useResetState();
  const [selectedId, setSelectedId] = useAtom(SelectedExampleIdAtom);
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [isLoading] = useAtom(IsLoadingAtom);

  return (
    <section className="panel section-card">
      <div className="section-title">Cenarios de exemplo</div>
      <div className="example-grid">
        {exampleImages.map((image) => (
          <button
            key={image.id}
            type="button"
            className={`example-card ${selectedId === image.id ? 'is-selected' : ''}`}
            onClick={() => {
              resetState();
              setSelectedId(image.id);
              setIsUploadedImage(false);
              setImageSrc(image.src);
            }}
            disabled={isLoading}>
            <img src={image.src} alt={image.name} loading="lazy" />
            <span className="example-card__name">{image.name}</span>
            <span className="example-card__description">{image.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}