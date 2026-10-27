import { Box, IconButton } from '@mui/material';

export default function ListingMediaGallery({ media, onRemove, disabled = false }) {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1, pr: 1, maxWidth: '100%' }}>
            {media.map((item, index) => (
                <Box key={`${item.publicId || item.url}-${index}`} sx={{ position: 'relative', overflow: 'visible', border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc', width: 96, height: 72, flexShrink: 0 }}>
                    {item.mediaType === 'VIDEO' ? (
                        <Box component="video" src={item.url} controls preload="metadata" aria-label={`Portfolio video ${index + 1}`} sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    ) : (
                        <Box component="img" src={item.url} alt={`Portfolio image ${index + 1}`} loading="lazy" sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    )}
                    <IconButton type="button" aria-label={`Remove portfolio ${item.mediaType === 'VIDEO' ? 'video' : 'image'} ${index + 1}`} disabled={disabled} onClick={() => onRemove(index)} size="small" sx={{ position: 'absolute', top: -7, right: -7, zIndex: 1, width: 22, height: 22, border: '1px solid #e2e8f0', bgcolor: 'rgba(255,255,255,0.95)', color: '#334155', boxShadow: '0 1px 5px #0002', '&:hover': { bgcolor: '#fff', color: '#b61f4b' } }}>
                        <Box component="svg" viewBox="0 0 24 24" aria-hidden="true" sx={{ width: 12, height: 12 }}><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></Box>
                    </IconButton>
                </Box>
            ))}
        </Box>
    );
}
