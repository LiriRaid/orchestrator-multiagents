import React, {useMemo} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';

const h = React.createElement;

const COLORS = {
	accent: 'cyan',
	success: 'green',
	warning: 'yellow',
	muted: 'gray'
};

const truncate = (value, size) => {
	if (!value) return '';
	return value.length > size ? `${value.slice(0, Math.max(0, size - 1))}…` : value;
};

const Panel = ({title, width, children}) =>
	h(
		Box,
		{
			borderStyle: 'round',
			borderColor: COLORS.accent,
			paddingX: 1,
			paddingY: 0,
			width,
			flexDirection: 'column'
		},
		h(Text, {bold: true, color: COLORS.accent}, title),
		h(Box, {marginTop: 0, flexDirection: 'column'}, children)
	);

const AgentCard = ({agent}) => {
	const statusColor = agent.status === 'busy' ? COLORS.success : COLORS.muted;
	return h(
		Box,
		{
			borderStyle: 'round',
			borderColor: statusColor,
			width: '24%',
			minHeight: 6,
			paddingX: 1,
			flexDirection: 'column'
		},
		h(Text, {bold: true}, agent.name),
		h(Text, {color: statusColor}, agent.status === 'busy' ? 'Ocupado' : 'En espera'),
		h(
			Text,
			{color: COLORS.muted},
			agent.task ? truncate(agent.task, 26) : 'Sin tarea activa'
		),
		h(Text, {color: COLORS.muted}, agent.detail || 'Listo para trabajar')
	);
};

export function App({snapshot, paused = false, onAction}) {
	const {stdout} = useStdout();
	const columns = stdout?.columns ?? 120;
	const isCompact = columns < 120;
	const summaryWidth = Math.max(20, Math.floor((isCompact ? columns : columns * 0.28) - 8));
	const queueWidth = Math.max(20, Math.floor((isCompact ? columns : columns * 0.42) - 8));
	const logWidth = Math.max(20, Math.floor((isCompact ? columns : columns * 0.35) - 8));
	const heroWidth = Math.max(20, columns - 8);
	const shortcutWidth = Math.max(20, columns - 4);
	const agentWidth = Math.max(18, Math.floor((isCompact ? columns : columns * 0.24) - 8));

	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			onAction?.('quit');
			return;
		}

		const normalized = input.toLowerCase();
		if (normalized === 'r') onAction?.('reload');
		if (normalized === 's') onAction?.('start');
		if (normalized === 'p') onAction?.('pause');
		if (normalized === 'q') onAction?.('quit');
	});

	const liveActiveLabel = snapshot.activeLabel || '0s';

	const busyCount = snapshot.agents.filter(agent => agent.status === 'busy').length;
	const overview = useMemo(
		() => [
			`Proyecto: ${snapshot.projectName}`,
			`Estado: ${snapshot.stateLabel || (paused ? 'Pausado' : 'Explorando Ink')}`,
			`Activo: ${liveActiveLabel}`,
			`Activos: ${busyCount}/${snapshot.agents.length}`,
			`Pendientes: ${snapshot.queue.length}`,
			`Completadas: ${snapshot.completed.length}`,
			`Costo: ${snapshot.totalCost}`
		],
		[busyCount, liveActiveLabel, paused, snapshot]
	);
	const heroLine = truncate(
		`${snapshot.timestamp}  |  ${snapshot.stateLabel || (paused ? 'Pausado' : 'Ink preview')}  |  activo ${liveActiveLabel}`,
		heroWidth
	);
	const shortcutRest = truncate(
		'S iniciar/reanudar  P pausar  R recargar QUEUE.md  Q salir y matar agentes',
		Math.max(0, shortcutWidth - 8)
	);

	return h(
		Box,
		{flexDirection: 'column', paddingX: 1, paddingY: 0},
		h(
			Box,
			{
				borderStyle: 'round',
				borderColor: COLORS.accent,
				paddingX: 1,
				paddingY: 0,
				marginBottom: 1,
				flexDirection: 'column'
			},
			h(Text, {bold: true, color: COLORS.accent}, snapshot.projectName),
			h(Text, {color: COLORS.muted}, heroLine)
		),
		h(
			Box,
			{marginBottom: 1},
			h(Text, {color: COLORS.warning}, 'Atajos: '),
			h(Text, {bold: true}, 'S'),
			h(Text, {color: COLORS.muted}, truncate(' iniciar/reanudar  ', Math.max(0, shortcutWidth - 40))),
			h(Text, {bold: true}, 'P'),
			h(Text, {color: COLORS.muted}, truncate(' pausar  ', Math.max(0, shortcutWidth - 55))),
			h(Text, {bold: true}, 'R'),
			h(Text, {color: COLORS.muted}, truncate(' recargar QUEUE.md  ', Math.max(0, shortcutWidth - 70))),
			h(Text, {bold: true}, 'Q'),
			h(Text, {color: COLORS.muted}, truncate(' salir y matar agentes', Math.max(0, shortcutWidth - 90)))
		),
		h(
			Box,
			{
				flexDirection: isCompact ? 'column' : 'row',
				gap: 1,
				marginBottom: 1
			},
			h(
				Panel,
				{title: 'Resumen', width: isCompact ? '100%' : '28%'},
				...overview.map(line => h(Text, {key: line}, truncate(line, summaryWidth)))
			),
			h(
				Panel,
				{title: 'Cola activa', width: isCompact ? '100%' : '42%'},
				...(snapshot.queue.length === 0
					? [h(Text, {color: COLORS.muted, key: 'empty-queue'}, 'No hay tareas pendientes.')]
					: snapshot.queue.slice(0, 6).map(task =>
							h(
								Text,
								{key: task.id},
								truncate(`${task.id} · ${task.title}`, queueWidth)
							)
					  ))
			),
			h(
				Panel,
				{title: 'Registro', width: isCompact ? '100%' : '35%'},
				...snapshot.logs
					.slice(-6)
					.map(entry => h(Text, {key: entry, color: COLORS.muted}, truncate(entry, logWidth)))
			)
		),
		h(
			Box,
			{
				flexDirection: 'row',
				flexWrap: 'wrap',
				columnGap: 1,
				rowGap: 1
			},
			...snapshot.agents.map(agent =>
				h(AgentCard, {
					key: agent.name,
					agent: {
						...agent,
						name: truncate(agent.name, agentWidth),
						task: agent.task ? truncate(agent.task, agentWidth) : null,
						detail: truncate(agent.detail || 'Listo para trabajar', agentWidth)
					}
				})
			)
		)
	);
}
