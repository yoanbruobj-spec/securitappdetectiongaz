import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface InterventionData {
  intervention: any
  centrales: any[]
  site: any
  client: any
  photos?: any[]
}

export async function generateInterventionPDF(data: InterventionData) {
  const { intervention, centrales, site, client, photos = [] } = data
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  let yPos = margin

  // Couleurs modernes et attractives
  const primaryColor: [number, number, number] = [59, 130, 246] // Bleu moderne
  const accentColor: [number, number, number] = [139, 92, 246] // Violet
  const successColor: [number, number, number] = [34, 197, 94] // Vert
  const warningColor: [number, number, number] = [251, 146, 60] // Orange
  const darkColor: [number, number, number] = [15, 23, 42] // Bleu foncé
  const lightGray: [number, number, number] = [248, 250, 252]
  const mediumGray: [number, number, number] = [226, 232, 240]

  // ============================================
  // PAGE DE GARDE PROFESSIONNELLE
  // ============================================
  
  // Bandeau supérieur avec dégradé
  doc.setFillColor(220, 38, 38) // Rouge Sécur'IT
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  // Nom de l'entreprise - Style professionnel
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.text('SECUR\'IT', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Detection Gaz - Expert en securite', pageWidth / 2, 38, { align: 'center' })

  // Coordonnées de l'entreprise
  yPos = 58
  doc.setFillColor(245, 245, 245)
  doc.rect(0, yPos, pageWidth, 28, 'F')
  
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('6 rue Georges BRASSENS, Zac des 4 saisons, 31140 Fonbeauzard', pageWidth / 2, yPos + 8, { align: 'center' })
  doc.text('Téléphone : 06 13 84 53 98', pageWidth / 2, yPos + 15, { align: 'center' })
  doc.text('E-mail : christophe.agnus@yahoo.fr', pageWidth / 2, yPos + 22, { align: 'center' })

  // Espace
  yPos = 100

  // Titre du rapport
  doc.setTextColor(...darkColor)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT D\'INTERVENTION', pageWidth / 2, yPos, { align: 'center' })

  // Ligne décorative
  doc.setDrawColor(220, 38, 38)
  doc.setLineWidth(1.5)
  doc.line(pageWidth / 2 - 50, yPos + 4, pageWidth / 2 + 50, yPos + 4)

  // Type d'intervention
  yPos += 18
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)

  // Mapping des types d'intervention avec accents français
  const typeMapping: Record<string, string> = {
    'maintenance_preventive': 'MAINTENANCE PRÉVENTIVE',
    'maintenance_corrective': 'MAINTENANCE CORRECTIVE',
    'verification_periodique': 'VÉRIFICATION PÉRIODIQUE',
    'installation': 'INSTALLATION',
    'mise_en_service': 'MISE EN SERVICE',
    'reparation': 'RÉPARATION',
    'depannage': 'DÉPANNAGE',
    'diagnostic': 'DIAGNOSTIC',
    'formation': 'FORMATION',
    'autre': 'AUTRE'
  }

  const typeIntervention = intervention.type
    ? (typeMapping[intervention.type] || intervention.type.replace(/_/g, ' ').toUpperCase())
    : 'INTERVENTION'

  doc.text(typeIntervention, pageWidth / 2, yPos, { align: 'center' })

  // Informations principales dans un encadré élégant
  yPos += 20
  const boxStartY = yPos
  const boxHeight = 85
  
  // Cadre principal avec bordure
  doc.setDrawColor(220, 38, 38)
  doc.setLineWidth(1)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, boxHeight, 5, 5, 'FD')
  
  yPos += 12
  
  // Grille d'informations 2 colonnes
  const colWidth = (pageWidth - 2 * margin - 20) / 2
  const leftX = margin + 10
  const rightX = margin + 10 + colWidth + 10
  
  // CLIENT
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('CLIENT', leftX, yPos)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(client?.nom || 'N/A', leftX, yPos + 6)
  
  // SITE
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('SITE', rightX, yPos)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(site?.nom || 'N/A', rightX, yPos + 6)
  
  yPos += 20
  
  // ADRESSE (sur toute la largeur)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('ADRESSE', leftX, yPos)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const adresseComplete = `${site?.adresse || ''}, ${site?.ville || ''}`.trim()
  doc.text(adresseComplete !== ',' ? adresseComplete : 'N/A', leftX, yPos + 6)
  
  yPos += 20
  
  // DATE
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('DATE D\'INTERVENTION', leftX, yPos)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const dateStr = intervention.date_intervention 
    ? new Date(intervention.date_intervention).toLocaleDateString('fr-FR') 
    : 'N/A'
  doc.text(dateStr, leftX, yPos + 6)
  
  // TECHNICIEN
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('TECHNICIEN', rightX, yPos)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(intervention.technicien || 'N/A', rightX, yPos + 6)
  
  yPos = boxStartY + boxHeight + 5

  // Pied de page élégant
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(9)
  doc.text(`Rapport N° ${intervention.id?.substring(0, 8).toUpperCase() || 'N/A'}`, pageWidth / 2, pageHeight - 25, { align: 'center' })
  doc.setFontSize(8)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

  // ============================================
  // PAGE 2 - INFORMATIONS GÉNÉRALES
  // ============================================
  
  doc.addPage()
  yPos = margin

  addSectionTitle(doc, 'INFORMATIONS GÉNÉRALES', yPos, primaryColor)
  yPos += 12

  const infoData = []
  
  if (client?.nom) infoData.push(['Client', client.nom])
  if (site?.nom) infoData.push(['Site', site.nom])
  
  const adresse = `${site?.adresse || ''}, ${site?.ville || ''}`.trim()
  if (adresse && adresse !== ',') infoData.push(['Adresse', adresse])
  
  infoData.push(['Date intervention', dateStr])
  
  const horaires = `${intervention.heure_debut || ''} - ${intervention.heure_fin || ''}`.trim()
  if (horaires && horaires !== '-') infoData.push(['Horaires', horaires])
  
  if (intervention.technicien) infoData.push(['Technicien', intervention.technicien])
  infoData.push(['Type', typeIntervention])
  if (intervention.local) infoData.push(['Local', intervention.local])
  if (intervention.contact_site) infoData.push(['Contact site', intervention.contact_site])
  if (intervention.tel_contact) infoData.push(['Téléphone', intervention.tel_contact])

  autoTable(doc, {
    startY: yPos,
    body: infoData,
    theme: 'striped',
    styles: {
      fontSize: 10,
      cellPadding: 6,
      lineColor: mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        fillColor: lightGray, 
        textColor: darkColor,
        cellWidth: 55 
      },
      1: { 
        cellWidth: 'auto',
        textColor: [0, 0, 0]
      },
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    margin: { left: margin, right: margin },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  if (intervention.observations_generales) {
    yPos = checkPageBreak(doc, yPos, 35)
    addSubsectionTitle(doc, 'Observations générales', yPos, accentColor)
    yPos += 8
    
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 40, 3, 3, 'F')
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const lines = doc.splitTextToSize(intervention.observations_generales, pageWidth - 2 * margin - 10)
    doc.text(lines, margin + 5, yPos + 6)
    yPos += Math.max(40, lines.length * 5) + 5
  }

  // ============================================
  // CENTRALES ET DÉTECTEURS
  // ============================================
  
  let needsNewPage = centrales.length > 0

  for (let i = 0; i < centrales.length; i++) {
    const centrale = centrales[i]
    
    if (needsNewPage) {
      doc.addPage()
      yPos = margin
      needsNewPage = false
    }

    addSectionTitle(doc, `CENTRALE ${i + 1} - ${centrale.marque} ${centrale.modele}`, yPos, primaryColor)
    yPos += 12

    const centraleData = []
    if (centrale.marque) centraleData.push(['Marque', centrale.marque])
    if (centrale.modele) centraleData.push(['Modèle', centrale.modele])
    if (centrale.numero_serie) centraleData.push(['N° série', centrale.numero_serie])
    if (centrale.firmware) centraleData.push(['Firmware', centrale.firmware])
    if (centrale.etat_general) centraleData.push(['État général', centrale.etat_general])

    if (centraleData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        body: centraleData,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: lightGray, textColor: darkColor, cellWidth: 50 },
        },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 8
    }

    // AES
    if (centrale.aes_presente && (centrale.aes_modele || centrale.aes_statut || centrale.aes_ondulee !== undefined)) {
      yPos = checkPageBreak(doc, yPos, 25)
      addSubsectionTitle(doc, 'Alimentation Electrique de Securite (AES)', yPos, successColor)
      yPos += 8

      const aesData = []
      if (centrale.aes_modele) aesData.push(['Modèle', centrale.aes_modele])
      if (centrale.aes_statut) aesData.push(['Statut', centrale.aes_statut])
      if (centrale.aes_ondulee !== undefined) aesData.push(['Ondulée', centrale.aes_ondulee ? 'Oui' : 'Non'])

      autoTable(doc, {
        startY: yPos,
        body: aesData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 45 },
        },
        margin: { left: margin + 8, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 8
    }

    // Détecteurs GAZ
    if (centrale.detecteurs_gaz && centrale.detecteurs_gaz.length > 0) {
      yPos = checkPageBreak(doc, yPos, 30)
      addSubsectionTitle(doc, 'Détecteurs Gaz', yPos, warningColor)
      yPos += 8

      for (const detecteur of centrale.detecteurs_gaz) {
        yPos = checkPageBreak(doc, yPos, 50)
        
        doc.setFillColor(...lightGray)
        doc.roundedRect(margin + 5, yPos, pageWidth - 2 * margin - 10, 5, 2, 2, 'F')
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...primaryColor)
        doc.text(`Ligne ${detecteur.ligne} - ${detecteur.marque} ${detecteur.modele}`, margin + 8, yPos + 3.5)
        yPos += 8

        const detecteurGazData = []
        if (detecteur.numero_serie) detecteurGazData.push(['N° série', detecteur.numero_serie])
        if (detecteur.gamme_mesure) {
          const typeGaz = detecteur.type_gaz || detecteur.gaz
          const gammeAvecGaz = typeGaz
            ? `${detecteur.gamme_mesure} (${typeGaz})`
            : detecteur.gamme_mesure
          detecteurGazData.push(['Gamme de mesure', gammeAvecGaz])
        }
        if (detecteur.temps_reponse) detecteurGazData.push(['Temps de réponse', detecteur.temps_reponse])
        
        const etalZero = `${detecteur.gaz_zero || ''} - ${detecteur.statut_zero || ''}`.trim()
        if (etalZero && etalZero !== '-') detecteurGazData.push(['Étalonnage zéro', etalZero])
        
        if (detecteur.valeur_avant_reglage || detecteur.valeur_apres_reglage || detecteur.coefficient) {
          const unite = detecteur.unite_etal || ''
          detecteurGazData.push(['Étalonnage sensibilité', `Avant réglage: ${detecteur.valeur_avant_reglage || 'N/A'} ${unite} / Après réglage: ${detecteur.valeur_apres_reglage || 'N/A'} ${unite} / Coefficient: ${detecteur.coefficient || 'N/A'}`])
        }
        
        if (detecteur.statut_sensi) detecteurGazData.push(['Statut', detecteur.statut_sensi])

        if (detecteur.date_remplacement) {
          const dateRemp = new Date(detecteur.date_remplacement).toLocaleDateString('fr-FR')
          detecteurGazData.push(['Date de remplacement', dateRemp])
        }
        if (detecteur.date_prochain_remplacement) {
          const dateProch = new Date(detecteur.date_prochain_remplacement).toLocaleDateString('fr-FR')
          detecteurGazData.push(['Prochain remplacement', dateProch])
        }

        if (detecteurGazData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            body: detecteurGazData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
              0: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 45 },
            },
            margin: { left: margin + 8, right: margin },
          })
          yPos = (doc as any).lastAutoTable.finalY + 3
        }

        // Seuils
        if (detecteur.seuils && detecteur.seuils.length > 0) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(...darkColor)
          doc.text('Seuils d\'alarme:', margin + 8, yPos)
          yPos += 4

          const seuilsData = detecteur.seuils.map((seuil: any) => {
            let assервStatus = 'Non'
            if (seuil.non_teste) {
              assервStatus = 'Non testé'
            } else if (seuil.asserv_operationnel) {
              assервStatus = 'Oui'
            }

            return [
              seuil.niveau ? `Seuil ${seuil.niveau}` : (seuil.nom || 'N/A'),
              `${seuil.valeur || 'N/A'} ${seuil.unite || ''}`,
              seuil.asservissements || 'N/A',
              assервStatus,
            ]
          })

          autoTable(doc, {
            startY: yPos,
            head: [['Seuil', 'Valeur', 'Asservissements', 'Asserv. OK']],
            body: seuilsData,
            theme: 'striped',
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: darkColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            margin: { left: margin + 12, right: margin },
          })
          yPos = (doc as any).lastAutoTable.finalY + 6
        }
      }
    }

    // Détecteurs FLAMME
    if (centrale.detecteurs_flamme && centrale.detecteurs_flamme.length > 0) {
      yPos = checkPageBreak(doc, yPos, 30)
      addSubsectionTitle(doc, 'Détecteurs Flamme', yPos, [239, 68, 68])
      yPos += 8

      for (const detecteur of centrale.detecteurs_flamme) {
        yPos = checkPageBreak(doc, yPos, 30)
        
        doc.setFillColor(...lightGray)
        doc.roundedRect(margin + 5, yPos, pageWidth - 2 * margin - 10, 5, 2, 2, 'F')
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...primaryColor)
        doc.text(`Ligne ${detecteur.ligne} - ${detecteur.marque} ${detecteur.modele}`, margin + 8, yPos + 3.5)
        yPos += 8

        const detecteurFlammeData = []
        if (detecteur.numero_serie) detecteurFlammeData.push(['N° série', detecteur.numero_serie])
        if (detecteur.type_connexion) detecteurFlammeData.push(['Type de connexion', detecteur.type_connexion])
        if (detecteur.asservissements) detecteurFlammeData.push(['Asservissements', detecteur.asservissements])

        let assервFlammeStatus = 'Non'
        if (detecteur.non_teste) {
          assервFlammeStatus = 'Non testé'
        } else if (detecteur.asserv_operationnel) {
          assервFlammeStatus = 'Oui'
        }
        detecteurFlammeData.push(['Opérationnel', assервFlammeStatus])

        if (detecteurFlammeData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            body: detecteurFlammeData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
              0: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 45 },
            },
            margin: { left: margin + 8, right: margin },
          })
          yPos = (doc as any).lastAutoTable.finalY + 6
        }
      }
    }

    // Observations
    const hasObservations = centrale.travaux_effectues || centrale.anomalies || centrale.recommandations || centrale.pieces_remplacees
    if (hasObservations) {
      yPos = checkPageBreak(doc, yPos, 30)
      addSubsectionTitle(doc, 'Observations', yPos, accentColor)
      yPos += 6

      if (centrale.travaux_effectues) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...darkColor)
        doc.text('Travaux effectués:', margin + 5, yPos)
        yPos += 4
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const lines = doc.splitTextToSize(centrale.travaux_effectues, pageWidth - 2 * margin - 10)
        doc.text(lines, margin + 5, yPos)
        yPos += lines.length * 4 + 4
      }

      if (centrale.anomalies) {
        yPos = checkPageBreak(doc, yPos, 15)
        doc.setFont('helvetica', 'bold')
        doc.text('Anomalies constatées:', margin + 5, yPos)
        yPos += 4
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(centrale.anomalies, pageWidth - 2 * margin - 10)
        doc.text(lines, margin + 5, yPos)
        yPos += lines.length * 4 + 4
      }

      if (centrale.recommandations) {
        yPos = checkPageBreak(doc, yPos, 15)
        doc.setFont('helvetica', 'bold')
        doc.text('Recommandations:', margin + 5, yPos)
        yPos += 4
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(centrale.recommandations, pageWidth - 2 * margin - 10)
        doc.text(lines, margin + 5, yPos)
        yPos += lines.length * 4 + 4
      }

      if (centrale.pieces_remplacees) {
        yPos = checkPageBreak(doc, yPos, 15)
        doc.setFont('helvetica', 'bold')
        doc.text('Pièces remplacées:', margin + 5, yPos)
        yPos += 4
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(centrale.pieces_remplacees, pageWidth - 2 * margin - 10)
        doc.text(lines, margin + 5, yPos)
        yPos += lines.length * 4 + 8
      }
    }

    needsNewPage = i < centrales.length - 1
  }

  // ============================================
  // PHOTOS
  // ============================================
  
  if (photos && photos.length > 0) {
    doc.addPage()
    yPos = margin

    addSectionTitle(doc, 'PHOTOS', yPos, accentColor)
    yPos += 15

    const photosPerRow = 2
    const photoWidth = (pageWidth - 2 * margin - 10) / photosPerRow
    const photoHeight = photoWidth * 0.75
    let currentX = margin
    let photosInRow = 0

    for (const photo of photos) {
      if (photo.url) {
        try {
          yPos = checkPageBreak(doc, yPos, photoHeight + 25)
          
          doc.addImage(photo.url, 'JPEG', currentX, yPos, photoWidth, photoHeight)
          
          if (photo.legende) {
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.setFont('helvetica', 'normal')
            const legendLines = doc.splitTextToSize(photo.legende, photoWidth - 4)
            doc.text(legendLines, currentX + 2, yPos + photoHeight + 4)
          }

          photosInRow++
          currentX += photoWidth + 10

          if (photosInRow >= photosPerRow) {
            photosInRow = 0
            currentX = margin
            yPos += photoHeight + 20
          }
        } catch (error) {
          console.error('Erreur ajout photo au PDF:', error)
        }
      }
    }
  }

  // ============================================
  // CONCLUSION
  // ============================================
  
  if (intervention.observations_generales && intervention.observations_generales.includes('CONCLUSION:')) {
    doc.addPage()
    yPos = margin

    addSectionTitle(doc, 'CONCLUSION', yPos, successColor)
    yPos += 12

    const conclusionText = intervention.observations_generales.split('CONCLUSION:')[1]?.trim()
    if (conclusionText) {
      doc.setFillColor(...lightGray)
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 60, 5, 5, 'F')
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const lines = doc.splitTextToSize(conclusionText, pageWidth - 2 * margin - 10)
      doc.text(lines, margin + 5, yPos + 6)
    }
  }

  // Numérotation élégante
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  const fileName = `Rapport_${client?.nom || 'Client'}_${dateStr.replace(/\//g, '-')}.pdf`
  doc.save(fileName)
}

// Fonctions utilitaires

function addSectionTitle(doc: jsPDF, title: string, yPos: number, color: [number, number, number]) {
  const pageWidth = doc.internal.pageSize.width
  const margin = 15

  doc.setFillColor(...color)
  doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, 10, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin + 5, yPos + 4)
}

function addSubsectionTitle(doc: jsPDF, title: string, yPos: number, color: [number, number, number]) {
  const margin = 15
  
  doc.setFillColor(...color)
  doc.circle(margin + 3, yPos - 1, 2, 'F')
  
  doc.setTextColor(...color)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin + 8, yPos)
}

function checkPageBreak(doc: jsPDF, yPos: number, spaceNeeded: number): number {
  const pageHeight = doc.internal.pageSize.height
  if (yPos + spaceNeeded > pageHeight - 25) {
    doc.addPage()
    return 15
  }
  return yPos
}