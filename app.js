const { useState, useEffect } = React;
const { Plus, Search, Download, Trash2, Edit2 } = lucide;

function BeerDatabase() {
  const [beers, setBeers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [filteredBeers, setFilteredBeers] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    nacionalidad: '',
    color: '',
    observaciones: '',
    puntuacion: '',
    imagen: ''
  });

  useEffect(() => {
    const savedBeers = localStorage.getItem('beers');
    if (savedBeers) {
      setBeers(JSON.parse(savedBeers));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('beers', JSON.stringify(beers));
    setFilteredBeers(beers);
  }, [beers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.nombre || !formData.tipo || !formData.nacionalidad || !formData.color || !formData.puntuacion) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    
    if (editingId) {
      setBeers(beers.map(beer => 
        beer.id === editingId ? { ...formData, id: editingId } : beer
      ));
      setEditingId(null);
    } else {
      setBeers([...beers, { ...formData, id: Date.now() }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: '',
      nacionalidad: '',
      color: '',
      observaciones: '',
      puntuacion: '',
      imagen: ''
    });
    setShowForm(false);
  };

  const handleEdit = (beer) => {
    setFormData(beer);
    setEditingId(beer.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setBeers(beers.filter(beer => beer.id !== id));
  };

  const executeSQLQuery = () => {
    if (!sqlQuery.trim()) {
      setFilteredBeers(beers);
      return;
    }

    const query = sqlQuery.toLowerCase().trim();
    
    try {
      let result = [...beers];

      if (query.includes('where')) {
        const whereClause = query.split('where')[1].trim();
        
        result = beers.filter(beer => {
          const conditions = whereClause.split('and').map(c => c.trim());
          
          return conditions.every(condition => {
            const likeMatch = condition.match(/(\w+)\s+like\s+['"]%(.+)%['"]/i);
            const equalMatch = condition.match(/(\w+)\s*=\s*['"](.+)['"]/i);
            const gtMatch = condition.match(/(\w+)\s*>\s*(\d+)/i);
            const ltMatch = condition.match(/(\w+)\s*<\s*(\d+)/i);
            
            if (likeMatch) {
              const [, field, value] = likeMatch;
              return beer[field]?.toLowerCase().includes(value.toLowerCase());
            } else if (equalMatch) {
              const [, field, value] = equalMatch;
              return beer[field]?.toLowerCase() === value.toLowerCase();
            } else if (gtMatch) {
              const [, field, value] = gtMatch;
              return parseFloat(beer[field]) > parseFloat(value);
            } else if (ltMatch) {
              const [, field, value] = ltMatch;
              return parseFloat(beer[field]) < parseFloat(value);
            }
            return true;
          });
        });
      }

      if (query.includes('order by')) {
        const orderClause = query.split('order by')[1].trim();
        const [field, direction] = orderClause.split(/\s+/);
        const isDesc = direction?.toLowerCase() === 'desc';
        
        result.sort((a, b) => {
          const aVal = a[field] || '';
          const bVal = b[field] || '';
          
          if (!isNaN(aVal) && !isNaN(bVal)) {
            return isDesc ? bVal - aVal : aVal - bVal;
          }
          
          return isDesc 
            ? bVal.toString().localeCompare(aVal.toString())
            : aVal.toString().localeCompare(bVal.toString());
        });
      }

      setFilteredBeers(result);
    } catch (error) {
      alert('Error en la consulta SQL. Verifica la sintaxis.');
    }
  };

  const downloadData = () => {
    const dataStr = JSON.stringify(beers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mis_cervezas.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return React.createElement('div', { className: 'min-h-screen bg-amber-50 p-4' },
    React.createElement('div', { className: 'max-w-7xl mx-auto' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-6 mb-6' },
        React.createElement('div', { className: 'flex justify-between items-center mb-6' },
          React.createElement('h1', { className: 'text-3xl font-bold text-amber-800' }, '🍺 Mi Colección de Cervezas'),
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement('button', {
              onClick: () => setShowForm(!showForm),
              className: 'bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700'
            },
              React.createElement(Plus, { size: 20 }),
              showForm ? 'Cancelar' : 'Agregar Cerveza'
            ),
            React.createElement('button', {
              onClick: downloadData,
              className: 'bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700'
            },
              React.createElement(Download, { size: 20 }),
              'Descargar'
            )
          )
        ),

        showForm && React.createElement('div', { className: 'mb-6 bg-amber-50 p-4 rounded-lg' },
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
            React.createElement('input', {
              type: 'text',
              name: 'nombre',
              value: formData.nombre,
              onChange: handleInputChange,
              placeholder: 'Nombre *',
              className: 'border border-amber-300 rounded px-3 py-2'
            }),
            React.createElement('input', {
              type: 'text',
              name: 'tipo',
              value: formData.tipo,
              onChange: handleInputChange,
              placeholder: 'Tipo (IPA, Lager, Stout...) *',
              className: 'border border-amber-300 rounded px-3 py-2'
            }),
            React.createElement('input', {
              type: 'text',
              name: 'nacionalidad',
              value: formData.nacionalidad,
              onChange: handleInputChange,
              placeholder: 'Nacionalidad *',
              className: 'border border-amber-300 rounded px-3 py-2'
            }),
            React.createElement('input', {
              type: 'text',
              name: 'color',
              value: formData.color,
              onChange: handleInputChange,
              placeholder: 'Color (Rubia, Negra, Tostada...) *',
              className: 'border border-amber-300 rounded px-3 py-2'
            }),
            React.createElement('input', {
              type: 'number',
              name: 'puntuacion',
              value: formData.puntuacion,
              onChange: handleInputChange,
              placeholder: 'Puntuación (1-10) *',
              min: '1',
              max: '10',
              step: '0.1',
              className: 'border border-amber-300 rounded px-3 py-2'
            }),
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement('label', { className: 'cursor-pointer bg-amber-200 px-4 py-2 rounded hover:bg-amber-300 flex items-center gap-2' },
                '📷 Subir Foto',
                React.createElement('input', {
                  type: 'file',
                  accept: 'image/*',
                  onChange: handleImageChange,
                  className: 'hidden'
                })
              ),
              formData.imagen && React.createElement('span', { className: 'text-sm text-green-600' }, '✓ Foto cargada')
            )
          ),
          React.createElement('textarea', {
            name: 'observaciones',
            value: formData.observaciones,
            onChange: handleInputChange,
            placeholder: 'Observaciones',
            className: 'border border-amber-300 rounded px-3 py-2 w-full mb-4',
            rows: '3'
          }),
          React.createElement('button', {
            onClick: handleSubmit,
            className: 'bg-amber-700 text-white px-6 py-2 rounded-lg hover:bg-amber-800'
          }, editingId ? 'Actualizar' : 'Guardar', ' Cerveza')
        ),

        React.createElement('div', { className: 'mb-6' },
          React.createElement('h2', { className: 'text-xl font-bold text-amber-800 mb-2' }, 'Buscador SQL'),
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement('input', {
              type: 'text',
              value: sqlQuery,
              onChange: (e) => setSqlQuery(e.target.value),
              placeholder: "SELECT * FROM cervezas WHERE tipo LIKE '%IPA%' ORDER BY puntuacion DESC",
              className: 'flex-1 border border-amber-300 rounded px-3 py-2'
            }),
            React.createElement('button', {
              onClick: executeSQLQuery,
              className: 'bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700'
            },
              React.createElement(Search, { size: 20 }),
              'Buscar'
            )
          ),
          React.createElement('p', { className: 'text-sm text-gray-600 mt-2' },
            'Ejemplos: WHERE tipo = "IPA" | WHERE puntuacion > 8 | WHERE nacionalidad LIKE "%España%" ORDER BY puntuacion DESC'
          )
        )
      ),

      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
        filteredBeers.map(beer =>
          React.createElement('div', { key: beer.id, className: 'bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow' },
            beer.imagen && React.createElement('img', { src: beer.imagen, alt: beer.nombre, className: 'w-full h-48 object-contain mb-3 rounded' }),
            React.createElement('h3', { className: 'text-xl font-bold text-amber-800 mb-2' }, beer.nombre),
            React.createElement('div', { className: 'space-y-1 text-sm mb-3' },
              React.createElement('p', null, React.createElement('span', { className: 'font-semibold' }, 'Tipo:'), ' ', beer.tipo),
              React.createElement('p', null, React.createElement('span', { className: 'font-semibold' }, 'Nacionalidad:'), ' ', beer.nacionalidad),
              React.createElement('p', null, React.createElement('span', { className: 'font-semibold' }, 'Color:'), ' ', beer.color),
              React.createElement('p', null, React.createElement('span', { className: 'font-semibold' }, 'Puntuación:'), ' ⭐ ', beer.puntuacion, '/10'),
              beer.observaciones && React.createElement('p', { className: 'text-gray-600 italic mt-2' }, beer.observaciones)
            ),
            React.createElement('div', { className: 'flex gap-2 mt-3' },
              React.createElement('button', {
                onClick: () => handleEdit(beer),
                className: 'flex-1 bg-blue-500 text-white px-3 py-1 rounded flex items-center justify-center gap-1 hover:bg-blue-600'
              },
                React.createElement(Edit2, { size: 16 }),
                'Editar'
              ),
              React.createElement('button', {
                onClick: () => handleDelete(beer.id),
                className: 'flex-1 bg-red-500 text-white px-3 py-1 rounded flex items-center justify-center gap-1 hover:bg-red-600'
              },
                React.createElement(Trash2, { size: 16 }),
                'Eliminar'
              )
            )
          )
        )
      ),

      filteredBeers.length === 0 && React.createElement('div', { className: 'text-center py-12 text-gray-500' },
        beers.length === 0 
          ? 'No hay cervezas en tu colección. ¡Agrega la primera!'
          : 'No se encontraron resultados para tu búsqueda SQL.'
      )
    )
  );
}

// Cargar Lucide icons
const script = document.createElement('script');
script.src = 'https://unpkg.com/lucide@latest';
script.onload = () => {
  lucide.createIcons();
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(BeerDatabase));
};
document.head.appendChild(script);