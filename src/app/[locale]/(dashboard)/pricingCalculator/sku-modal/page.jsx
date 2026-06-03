'use client'

import AddSKUModal from '../pl/AddSKUModal'

export default function Page() {
    return (
        <div className="relative min-h-screen bg-muted/30">
            <AddSKUModal
                open={true}
                onClose={() => {}}
                onSubmit={async (data) => {
                    console.log('AddSKUModal submit:', data)
                }}
                categoryOptions={[
                    { value: 'cat-1', label: 'Foto & Album' },
                    { value: 'cat-2', label: 'Stiker & Cetak' },
                    { value: 'cat-3', label: 'Aksesoris' },
                ]}
                subCategoryOptions={[
                    { value: 'sub-1', label: 'Album Mini' },
                    { value: 'sub-2', label: 'Album Besar' },
                    { value: 'sub-3', label: 'Stiker Custom' },
                ]}
                brandOptions={[
                    { value: 'brand-1', label: 'Sirius Brand' },
                    { value: 'brand-2', label: 'Dayacipta' },
                ]}
            />
        </div>
    )
}
