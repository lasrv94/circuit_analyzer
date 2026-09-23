from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class MeterPoint(BaseModel):
    id: str = Field(..., description="Identificador único del medidor (ej: M-01, S-01)")
    label: str = Field(..., description="Etiqueta legible para mostrar sobre el plano")
    circuit_name: str = Field(default="", description="Nombre del circuito o alimentador")
    type: str = Field(default="subcircuit", description="'main' para acometida principal o 'subcircuit' para primer nivel")
    x: float = Field(..., description="Posición X relativa en porcentaje (0 a 100)")
    y: float = Field(..., description="Posición Y relativa en porcentaje (0 a 100)")
    radius: float = Field(default=16.0, description="Radio del círculo en píxeles del lienzo")
    rating_amps: Optional[int] = Field(default=None, description="Capacidad del interruptor o dona en Amperios")
    confidence: float = Field(default=1.0, description="Nivel de confianza de la detección (0.0 a 1.0)")
    legal_notes: Optional[str] = Field(default="", description="Notas de cumplimiento normativo o advertencias físicas")
    page: int = Field(default=1, description="Número de página en el PDF (1-index)")

class PageAnalysisResult(BaseModel):
    page: int
    points: List[MeterPoint]
    summary: str = ""
    rules_applied: List[str] = Field(default_factory=list)

class ExportPdfRequest(BaseModel):
    pdf_filename: str
    annotations: List[MeterPoint]
