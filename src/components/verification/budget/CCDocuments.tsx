// Cost center PDFs shown on every budget verification (web verificationConfigs.jsx CCDocsBlock).
// Getccuploadocsexists only returns them for users set up in Budget View Attachment Config.
// `execPath` overrides the lookup's approved-budget-for-execution file (a CC budget carries its own);
// pass null to hide it.
import React, { useCallback } from 'react';
import { getCCUploadDocs } from '@/src/api/verification/budgetVerificationAPI';
import { useApiData } from '@/src/hooks/useApiData';
import { buildCCBudgetDocUrl, buildCostCenterDocUrl } from '@/src/service/s3Config';
import { DocumentLinks } from '../kit/VerificationKit';

type Props = { ccCode?: string; uid: string; execPath?: string | null; extra?: { label: string; url: string | null }[] };

export default function CCDocuments({ ccCode, uid, execPath, extra = [] }: Props) {
    const load = useCallback(() => getCCUploadDocs(ccCode!, uid), [ccCode, uid]);
    const { data: doc } = useApiData(ccCode && uid ? load : null);

    const shown = doc?.contractscopeisexists === 'Yes';
    const exec = execPath !== undefined ? execPath : shown ? doc?.Approvedbudgetexecution : null;

    return (
        <DocumentLinks
            links={[
                ...extra,
                { label: 'Scope check list approved by contracts', url: shown ? buildCostCenterDocUrl(doc?.contractscope) : null },
                { label: 'Client Work Order confirmation with T & C', url: shown ? buildCostCenterDocUrl(doc?.contractpretenderBudget) : null },
                { label: 'Approved budget for execution', url: exec ? buildCCBudgetDocUrl(exec) : null },
            ]}
        />
    );
}
