import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, Grid, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ProjectGallery = () => {
    const [circuits, setCircuits] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCircuits = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/circuits/');
                if (response.ok) {
                    const data = await response.json();
                    setCircuits(data.filter(c => c.is_public));
                }
            } catch (err) {
                console.error("Failed to load gallery:", err);
            }
        };
        fetchCircuits();
    }, []);

    const handleFork = (id) => {
        // Loads circuit natively; upon standard save it generates duplicate entry effortlessly mapping
        navigate(`/project/${id}`);
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#121212', minHeight: '100vh', color: '#fff', overflow: 'auto', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', fontFamily: 'Segoe UI' }}>
                    🌩️ Cloud Circuit Gallery
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/dashboard/default')}
                >
                    Back to Canvas
                </Button>
            </Box>
            <Typography variant="subtitle1" sx={{ mb: 4, color: '#aaa' }}>
                Discover, fork, and interact with community-published simulation boundaries natively.
            </Typography>

            <Grid container spacing={3}>
                {circuits.map(circuit => (
                    <Grid item xs={12} sm={6} md={4} key={circuit.id}>
                        <Card sx={{ bgcolor: '#1e1e1e', color: '#fff', border: '1px solid #333' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#90caf9' }}>
                                    {circuit.name}
                                </Typography>
                                <Box sx={{ my: 1, display: 'flex', gap: 1 }}>
                                    <Chip size="small" label={`ID: ${circuit.id}`} sx={{ bgcolor: '#333', color: '#aaa' }} />
                                    <Chip size="small" label={new Date(circuit.created_at).toLocaleDateString()} sx={{ bgcolor: '#333', color: '#aaa' }} />
                                </Box>
                                <Typography variant="body2" sx={{ color: '#ccc', mt: 2, minHeight: '40px' }}>
                                    {circuit.description || 'No description provided.'}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ borderTop: '1px solid #333', bgcolor: '#252526', px: 2, py: 1.5 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleFork(circuit.id)}
                                    sx={{ bgcolor: '#00af50', '&:hover': { bgcolor: '#008f40' } }}
                                >
                                    🍴 Fork into Workspace
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {circuits.length === 0 && (
                <Typography variant="body1" sx={{ color: '#aaa', mt: 4 }}>
                    No public circuits available in the database yet. Cloud sync a project to see it here!
                </Typography>
            )}
        </Box>
    );
};

export default ProjectGallery;
