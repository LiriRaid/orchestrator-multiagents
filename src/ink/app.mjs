import React, {useEffect, useMemo, useState} from 'react';
import {Box, Static, Text, useInput, useStdout} from 'ink';

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

const formatDuration = seconds => {
	if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m${seconds % 60 ? `${seconds % 60}s` : ''}`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h${minutes % 60}m`;
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
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);

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

	const liveActiveLabel = snapshot.startedAt
		? formatDuration(Math.max(0, Math.round((now - snapshot.startedAt) / 1000)))
		: snapshot.activeLabel || '0s';

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
			h(
				Text,
				{color: COLORS.muted},
				`${snapshot.timestamp}  |  ${snapshot.stateLabel || (paused ? 'Pausado' : 'Ink preview')}  |  activo ${liveActiveLabel}`
			)
		),
		h(
			Box,
			{marginBottom: 1},
			h(
				Text,
				{color: COLORS.warning},
				'Atajos: '
			),
			h(Text, {bold: true}, 'S'),
			h(Text, {color: COLORS.muted}, ' iniciar/reanudar  '),
			h(Text, {bold: true}, 'P'),
			h(Text, {color: COLORS.muted}, ' pausar  '),
			h(Text, {bold: true}, 'R'),
			h(Text, {color: COLORS.muted}, ' recargar QUEUE.md  '),
			h(Text, {bold: true}, 'Q'),
			h(Text, {color: COLORS.muted}, ' salir y matar agentes')
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
				...overview.map(line => h(Text, {key: line}, line))
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
								`${task.id} · ${truncate(task.title, isCompact ? 40 : 54)}`
							)
					  ))
			),
			h(
				Panel,
				{title: 'Registro', width: isCompact ? '100%' : '35%'},
				h(
					Static,
					{items: snapshot.logs.slice(-6)},
					entry => h(Text, {key: entry, color: COLORS.muted}, truncate(entry, isCompact ? 100 : 100))
				)
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
			...snapshot.agents.map(agent => h(AgentCard, {key: agent.name, agent}))
		)
	);
}
